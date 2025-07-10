import { OpenAI } from "openai"
import { NextResponse } from "next/server"
import { tradingFunctions, knownTokenAddresses } from "@/lib/functions/trading-functions"
import { supabaseAdmin } from "@/lib/supabase/client"
import { formatTimeInTimezone, getUserTimezone, isValidTimezone, convertTradingFunctionTimesToUTC } from "@/lib/utils/timezone-utils"
import { MCPClient } from "@/lib/mcp/mcp-client"
import { Agent, run, hostedMcpTool, RunToolApprovalItem } from '@openai/agents';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Known token addresses
const tokenAddresses: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  ORCA: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  SAMO: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
}

// Mock prices for demo
const mockPrices: Record<string, number> = {
  SOL: 210.45,
  BONK: 0.0000255,
  USDC: 1.0,
  USDT: 1.0,
  ETH: 3250.0,
  BTC: 67500.0,
  JUP: 0.85,
  ORCA: 3.2,
  RAY: 2.1,
  SAMO: 0.012,
  PYTH: 0.45,
}

function convertSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;

  const newSchema = { ...schema };

  if (schema.type === 'array') {
    // Ensure 'items' is defined
    if (!schema.items) {
      newSchema.items = {}; // or provide a default schema
    } else {
      // Recursively process 'items'
      newSchema.items = convertSchema(schema.items);
    }
  }

  if (schema.type === 'object' && schema.properties) {
    newSchema.properties = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      newSchema.properties[key] = convertSchema(propSchema);
    }
  }

  return newSchema;
}

function convertMCPToolsToOpenAI(mcpTools) {
  return mcpTools.map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(tool.inputSchema.properties || {}).map(
            ([key, schema]) => [key, convertSchema(schema)]
          )
        ),
        required: tool.inputSchema.required || [],
        additionalProperties: false,
      }
    }
  }));
}

export async function POST(req: Request) {
  try {
    const { messages, userId, currentTime, timezone } = await req.json()

    console.log("Processing chat with messages:", messages?.length || 0)
    console.log("User ID:", userId)
    console.log("Current Time:", currentTime)
    console.log("Timezone:", timezone)

    const client = new MCPClient(
      {
        name: "example-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    const scriptPath = path.join(__dirname, '../../../../../MCP-Servers-For-EthBee/evm-mcp-server/src/server/stdio-server.ts');
    console.log("🚓🚓🚓");
    console.log(scriptPath);

    await client.connect({ 
      type: "stdio",
      args: [scriptPath],
      command: "bun"
    });

    const tools = await client.getAllTools();

    console.log("💘💘💘tools:", tools)

    const openAITools = convertMCPToolsToOpenAI(tools);
    console.log("2OpenAI tools:", openAITools);

    // If OpenAI API key exists, try to use it
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      // Format current time for display
      const userTimezone = timezone && isValidTimezone(timezone) ? timezone : getUserTimezone()
      const formattedTime = currentTime 
        ? formatTimeInTimezone(new Date(currentTime), userTimezone, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : formatTimeInTimezone(new Date(), userTimezone, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })

      const systemMessage = {
        role: "system",
        content: `You are EthBee. the input user's query and there are tools that indicate the action we have to do. you should convert to user's query to tool. if there is no exact tool, skip it. you have to return exact tool and parameters. If there is parameters required, you can ask about it.`,
      }

      const conversationWithSystem = [systemMessage, ...messages]

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: conversationWithSystem,
        temperature: 0.7,
        tools: openAITools,
        tool_choice: "auto",
      })

      console.log(">>>response");
      console.log(response);

      const responseMessage = response.choices[0].message

      console.log(">>>responseMessage");
      console.log(responseMessage);
      console.log(responseMessage.tool_calls);

      // const finalText = [];
      // const toolResults = [];
      var finalResult;

      const systemMessage_second = {
        role: "system",
        content: `the input is including user's query and the data for user, you can answer for the user's query based on data inputed from second`,
      }
      const secondMessage = [systemMessage_second, ...messages]

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const tool_call of responseMessage.tool_calls) {
          const toolName = tool_call.function.name;
          const toolArgs = JSON.parse(tool_call.function.arguments) as { [x: string]: unknown } | undefined;
    
          const result = await client.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          console.log("👍👍👍");
          console.log(result);

          // toolResults.push(result);
          // finalText.push(
          //   `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
          // );
    
          secondMessage.push({
            role: "user",
            content: result.content[0]?.text ?? '',
          });

          console.log("🧨");
          console.log(secondMessage);

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: secondMessage,
            temperature: 0.7,
          })

          console.log("🎢🎢");
          console.log(response);
          console.log(response.choices[0].message);
          
          finalResult = response.choices[0].message;
          
          // finalText.push(
          //   response.choices[0].message
          // );
        }
      }

      // console.log("🚩🚩🚩");
      // console.log(finalText);

      return NextResponse.json(
        {
          response: {
            content: finalResult?.content
          }
        },
        { status: 200 },
      )
    } catch (openaiError) {
      console.log("OpenAI not available, falling back to mock responses:", openaiError)

      // Fallback to mock response
      const mockResponse = {
        content:
          "I'm your EthBee AI assistant! This is a demo version. In your local environment with proper API keys, I can execute real trades. Try commands like 'Buy 0.5 SOL' or 'Check my balance'.",
      }

      return NextResponse.json({ response: mockResponse })
    }
  } catch (error) {
    console.error("Error in chat API:", error)

    return NextResponse.json(
      {
        response: {
          content:
            "Sorry, there was an error processing your request. This is a demo environment - in your local setup, this would work seamlessly.",
        },
      },
      { status: 200 },
    )
  }
}
