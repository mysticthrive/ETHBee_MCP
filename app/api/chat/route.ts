import { OpenAI } from "openai"
import { NextResponse } from "next/server"
import { tradingFunctions, knownTokenAddresses } from "@/lib/functions/trading-functions"
import { supabaseAdmin } from "@/lib/supabase/client"
import { formatTimeInTimezone, getUserTimezone, isValidTimezone, convertTradingFunctionTimesToUTC } from "@/lib/utils/timezone-utils"

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

// Execute action based on OpenAI function call
async function executeAction(functionName: string, args: any, userId?: string) {
  console.log("🧠AI CHAT ROUTE--------------------------------")
  console.log("Executing action:", functionName, args)
  console.log("args.conditions:", args.conditions)
  console.log("🧠AI CHAT ROUTE--------------------------------")

  switch (functionName) {
    case "buy_order":
      if (args.immediate_execution) {
        // Execute buy immediately
        const buyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/trade/buy`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              token_address: args.token_address,
              token_symbol: args.token_symbol,
              amount: args.amount,
              price_type: "market",
            }),
          },
        )

        const buyResult = await buyResponse.json()

        console.log("😣AI CHAT ROUTE--------------------------------")
        console.log("buyResult:", buyResult)
        console.log("😣AI CHAT ROUTE--------------------------------")

        if (buyResult.success) {
          return {
            content: `✅ Successfully purchased ${args.amount} ${args.token_symbol} for ${Number(buyResult.executed_action.in_amount)} SOL ($${Number(buyResult.executed_action.price).toFixed(6)})\n\nTransaction Hash: ${buyResult.tx_hash}\n\nYour updated portfolio will reflect this purchase shortly.`,
            executedAction: buyResult.executed_action,
            token_info: buyResult.token_info,
          }
        } else {
          return {
            content: `❌ Sorry, there was an issue with your purchase of ${args.amount} ${args.token_symbol}. ${buyResult.error}`,
            executedAction: buyResult.executed_action,
            token_info: buyResult.token_info,
          }
        }
      } else {
        // Create conditional buy booking order
        const bookingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/booking-orders/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              action_type: "buy_booking",
              token_address: args.token_address,
              token_symbol: args.token_symbol,
              amount: args.amount,
              conditions: args.conditions,
              logic_type: args.logic_type || "AND",
            }),
          },
        )

        const bookingResult = await bookingResponse.json()

        if (bookingResult.success) {
          return {
            content: `✅ I've created a conditional buy booking order for ${args.amount} ${args.token_symbol}. Order ID: ${bookingResult.data.id}\n\nThe order will execute when your specified conditions are met. You can monitor its status in real-time below.`,
            executedAction: {
              type: "buy_booking",
              asset: args.token_symbol,
              amount: Number.parseFloat(args.amount),
              success: true,
              conditions: args.conditions,
              logic_type: args.logic_type,
              order_id: bookingResult.data.id,
            },
            booking_order: bookingResult.data,
          }
        } else {
          return {
            content: `❌ Failed to create booking order: ${bookingResult.error}`,
            executedAction: {
              type: "buy_booking",
              asset: args.token_symbol,
              amount: Number.parseFloat(args.amount),
              success: false,
            },
          }
        }
      }

    case "sell_order":
      if (args.immediate_execution) {
        // Execute sell immediately
        const sellResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/trade/sell`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              token_address: args.token_address,
              token_symbol: args.token_symbol,
              amount: args.amount,
              price_type: "market",
            }),
          },
        )

        const sellResult = await sellResponse.json()

        if (sellResult.success) {
          return {
            content: `✅ Successfully sold ${args.amount} ${args.token_symbol} at ${sellResult.token_info.price.toFixed(4)} SOL per token!\n\nTransaction Hash: ${sellResult.tx_hash}\n\nThe proceeds have been added to your wallet balance.`,
            executedAction: sellResult.executed_action,
            token_info: sellResult.token_info,
          }
        } else {
          return {
            content: `❌ Sorry, there was an issue with your sale of ${args.amount} ${args.token_symbol}. ${sellResult.error}`,
            executedAction: sellResult.executed_action,
            token_info: sellResult.token_info,
          }
        }
      } else {
        // Create conditional sell booking order
        const bookingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/booking-orders/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              action_type: "sell_booking",
              token_address: args.token_address,
              token_symbol: args.token_symbol,
              amount: args.amount,
              conditions: args.conditions,
              logic_type: args.logic_type || "AND",
            }),
          },
        )

        const bookingResult = await bookingResponse.json()

        if (bookingResult.success) {
          return {
            content: `✅ I've created a conditional sell booking order for ${args.amount} ${args.token_symbol}. Order ID: ${bookingResult.data.id}\n\nThe order will execute when your specified conditions are met. You can monitor its status in real-time below.`,
            executedAction: {
              type: "sell_booking",
              asset: args.token_symbol,
              amount: Number.parseFloat(args.amount),
              success: true,
              conditions: args.conditions,
              logic_type: args.logic_type,
              order_id: bookingResult.data.id,
            },
            booking_order: bookingResult.data,
          }
        } else {
          return {
            content: `❌ Failed to create booking order: ${bookingResult.error}`,
            executedAction: {
              type: "sell_booking",
              asset: args.token_symbol,
              amount: Number.parseFloat(args.amount),
              success: false,
            },
          }
        }
      }

    case "get_wallet_balance":
      if (!userId) {
        return {
          content: "Please sign in to view your balance.",
        }
      }

      // Get real wallet balance from API
      const balanceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/wallet/balance`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": userId,
          },
        },
      )

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        return {
          content: `💰 **Wallet Balance**\n\n${balanceData.balances
            .map((b: any) => `**${b.symbol} Balance:** ${b.amount} ${b.symbol} ($${b.usdValue.toFixed(2)})`)
            .join("\n")}\n\n**Total Portfolio Value:** $${balanceData.totalUsdValue.toFixed(2)}`,
          executedAction: {
            type: "check_balance",
            success: true,
          },
        }
      } else {
        // Fallback to mock data
        return {
          content: `💰 **Wallet Balance**\n\n**SOL Balance:** 2.45 SOL ($${(2.45 * mockPrices.SOL).toFixed(2)})\n**USDC Balance:** 150.00 USDC\n**BONK Balance:** 1,000,000 BONK ($${(1000000 * mockPrices.BONK).toFixed(2)})\n\n**Total Portfolio Value:** $${(2.45 * mockPrices.SOL + 150 + 1000000 * mockPrices.BONK).toFixed(2)}\n\nNote: This is demo data showing mock balances.`,
          executedAction: {
            type: "check_balance",
            success: true,
          },
        }
      }

    case "get_token_info":
      const tokenSymbol = args.token_symbol || "SOL"
      const price = mockPrices[tokenSymbol.toUpperCase()] || 1.0
      const priceChange = (Math.random() - 0.5) * 10

      return {
        content: `Here's information about ${tokenSymbol}:\n\n💰 **Current Price:** $${price.toFixed(4)}\n📈 **24h Change:** ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%\n📊 **Market Cap:** $${(Math.random() * 50 + 5).toFixed(1)}B\n💧 **Liquidity:** High\n\nNote: This is demo data for v0 preview.`,
        executedAction: {
          type: "get_token_info",
          asset: tokenSymbol,
          success: true,
          price: price,
        },
        token_info: {
          symbol: tokenSymbol,
          address: tokenAddresses[tokenSymbol] || tokenAddresses.SOL,
          price: price,
          priceChange: priceChange,
        },
      }

    case "notify_booking":
      const notifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/booking-orders/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            action_type: "notify_booking",
            token_address: args.token_address,
            token_symbol: args.token_symbol,
            amount: args.amount,
            conditions: args.conditions,
            logic_type: args.logic_type || "AND",
          }),
        },
      )

      const notifyResult = await notifyResponse.json()

      if (notifyResult.success) {
        return {
          content: `✅ I've set up a notification booking for ${args.token_symbol}. Order ID: ${notifyResult.data.id}\n\nYou'll be alerted when your specified conditions are met.`,
          executedAction: {
            type: "notify_booking",
            asset: args.token_symbol,
            success: true,
            conditions: args.conditions,
            logic_type: args.logic_type,
            order_id: notifyResult.data.id,
          },
          booking_order: notifyResult.data,
        }
      } else {
        return {
          content: `❌ Failed to create notification booking: ${notifyResult.error}`,
          executedAction: {
            type: "notify_booking",
            asset: args.token_symbol,
            success: false,
          },
        }
      }

    default:
      return {
        content:
          "I'm not sure how to process that request. You can ask me to buy, sell, or get information about Solana tokens.",
      }
  }
}

export async function POST(req: Request) {
  try {
    const { messages, userId, currentTime, timezone } = await req.json()

    console.log("Processing chat with messages:", messages?.length || 0)
    console.log("User ID:", userId)
    console.log("Current Time:", currentTime)
    console.log("Timezone:", timezone)
    
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
        content: `You are EthBee, an intelligent Solana trading assistant powered by advanced AI. You help users execute trades, monitor markets, and manage their Solana portfolio with natural language commands.

CURRENT CONTEXT:
- Current Time: ${formattedTime}
- User Timezone: ${userTimezone}

CRITICAL INSTRUCTIONS:
1. Solana addresses are CASE-SENSITIVE. You MUST PRESERVE THE EXACT CASE of any token address provided by the user.
2. Users may provide only token symbols (like SOL, USDC, BONK). If the request is vague, ask follow-up questions for clarity.
3. Maintain context from conversation history to understand follow-up questions and references to previous messages.
4. When handling time-based conditions, use the current time and timezone provided above for accurate calculations.
5. IMPORTANT: Always provide time values in the user's timezone (${userTimezone}) - the system will automatically convert them to UTC for storage.

AVAILABLE FUNCTIONS:
- **Immediate Trading**: Execute buy/sell orders instantly at market price
- **Conditional Orders**: Create orders with price and/or time conditions
- **Price Conditions**: Set triggers for "above", "below", or "between" specific prices
- **Time Conditions**: Set execution windows using either:
  * direct mode: Specific start/end times (YYYY-MM-DD HH:MM:SS format in user's timezone)
  * relative mode: Time offsets from a base time (e.g., "30 minutes from now")
- **Logic Operators**: Combine multiple conditions with AND/OR logic
- **Portfolio Management**: Check balances, view transactions, get token info
- **Notifications**: Set up alerts for when conditions are met

EXAMPLES:
- "Buy 0.5 SOL immediately" → Executes immediately
- "Buy 10 BONK when price drops below $0.00002" → Conditional order
- "Sell 2 SOL between 2-4 PM today" → Time-based condition (in user's timezone)
- "Buy 5 USDC when price is above $1.01 AND after 3 PM" → Combined conditions
- "Check my balance" → Portfolio overview
- "Get info about BONK" → Token information

Always be helpful, clear, and confirm user intentions before executing trades.`,
      }

      const conversationWithSystem = [systemMessage, ...messages]

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: conversationWithSystem,
        temperature: 0.7,
        tools: tradingFunctions,
        tool_choice: "auto",
      })

      const responseMessage = response.choices[0].message

      console.log(">>>responseMessage");
      console.log(responseMessage);
      console.log(responseMessage.tool_calls);

      let parsedResponse
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0]
        const functionName = toolCall.function.name

        try {
          const args = JSON.parse(toolCall.function.arguments)

          // For known tokens, ensure we're using the correct case-sensitive address
          if (args.token_symbol && !args.token_address && args.token_symbol in knownTokenAddresses) {
            args.token_address = knownTokenAddresses[args.token_symbol as keyof typeof knownTokenAddresses]
          }

          console.log(">>>args");
          console.log(args.conditions);
          console.log(userTimezone);

          // Convert time values to UTC
          const convertedArgs = convertTradingFunctionTimesToUTC(args, userTimezone)
          
          // Log the conversion for debugging
          if (args.conditions && args.conditions.length > 0) {
            console.log('Original args with time conditions:', JSON.stringify(args, null, 2))
            console.log('Converted args to UTC:', JSON.stringify(convertedArgs, null, 2))
          }

          // Execute the action
          parsedResponse = await executeAction(functionName, convertedArgs, userId)
        } catch (e) {
          console.error("Error parsing function arguments:", e)
          parsedResponse = {
            content: "I'm having trouble processing your request. Please try again with a clearer instruction.",
          }
        }
      } else if (responseMessage.content) {
        parsedResponse = {
          content: responseMessage.content,
        }
      } else {
        parsedResponse = {
          content: "I couldn't understand that request. Please try something like 'Buy 0.5 SOL' or 'Check my balance'.",
        }
      }

      return NextResponse.json({ response: parsedResponse })
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
