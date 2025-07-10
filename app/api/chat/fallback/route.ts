import { NextResponse } from "next/server"

// Define the response type to fix TypeScript errors
type TradingResponse = {
  action: string;
  content: string;
  token_symbol?: string;
  token_address?: string | null;
  amount?: string;
  price_type?: string;
  limit_price?: string | null;
  target_price?: string;
  direction?: string;
  // For booking orders
  conditions?: Array<{
    condition_type: string;
    condition_details: any;
  }>;
  logic_type?: 'AND' | 'OR';
  // For limit orders
  order_id?: string;
  status?: string;
}

// Helper function to get token address
function getTokenAddress(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case "SOL":
      return "So11111111111111111111111111111111111111112";
    case "USDC":
      return "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    case "BONK":
      return "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
    default:
      return "";
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Get the last user message
    const userInput = messages[messages.length - 1].content.toLowerCase()

    // Check if we have previous messages to provide context
    const hasContext = messages.length > 1

    console.log(`Using fallback API for: "${userInput}" (with context: ${hasContext}, total messages: ${messages.length})`)

    // Try to extract context from previous messages
    let contextualToken: string | null = null
    let contextualAmount: string | null = null
    let contextualAction: string | null = null

    // If we have context, scan previous messages for relevant information
    if (hasContext) {
      // Look through previous messages in reverse order (most recent first)
      for (let i = messages.length - 2; i >= 0; i--) {
        const prevMessage = messages[i]

        // Only look at assistant messages that might contain action information
        if (prevMessage.role === 'assistant' && prevMessage.content) {
          const content = prevMessage.content.toLowerCase()

          // Check for token mentions
          const tokenMatch = content.match(/\b(sol|usdc|bonk)\b/i)
          if (tokenMatch && !contextualToken) {
            contextualToken = tokenMatch[1].toUpperCase()
          }

          // Check for amount mentions
          const amountMatch = content.match(/\b(\d+(\.\d+)?)\s+(sol|usdc|bonk)\b/i)
          if (amountMatch && !contextualAmount) {
            contextualAmount = amountMatch[1]
          }

          // Check for action mentions
          if (content.includes('buy') && !contextualAction) {
            contextualAction = 'buy'
          } else if (content.includes('sell') && !contextualAction) {
            contextualAction = 'sell'
          }

          // If we found all context items, break early
          if (contextualToken && contextualAmount && contextualAction) {
            break
          }
        }
      }
    }

    // Simple rule-based fallback
    let response: TradingResponse = {
      action: "message",
      content:
        "I'm not sure how to help with that. Try asking about buying, selling, or getting information about Solana tokens.",
    }

    // Apply contextual information if available
    if (contextualAction && contextualToken && userInput.trim() === "yes") {
      if (contextualAction === "buy" && contextualAmount) {
        response = {
          action: "buy",
          token_symbol: contextualToken,
          token_address: getTokenAddress(contextualToken),
          amount: contextualAmount,
          price_type: "market",
          limit_price: null,
          content: `I'll help you buy ${contextualAmount} ${contextualToken}.`,
        }
      } else if (contextualAction === "sell" && contextualAmount) {
        response = {
          action: "sell",
          token_symbol: contextualToken,
          token_address: getTokenAddress(contextualToken),
          amount: contextualAmount,
          price_type: "market",
          limit_price: null,
          content: `I'll help you sell ${contextualAmount} ${contextualToken}.`,
        }
      }
    }

    // Check for buy intent
    if (userInput.includes("buy")) {
      const tokenMatch = userInput.match(/buy\s+(\d+(\.\d+)?)\s+([a-zA-Z]+)/i)
      if (tokenMatch) {
        const amount = Number.parseFloat(tokenMatch[1])
        const token = tokenMatch[3].toUpperCase()

        // Get token address for known tokens
        let tokenAddress = null
        if (token === "SOL") {
          tokenAddress = "So11111111111111111111111111111111111111112"
        } else if (token === "USDC") {
          tokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        } else if (token === "BONK") {
          tokenAddress = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
        }

        response = {
          action: "buy",
          token_symbol: token,
          token_address: tokenAddress,
          amount: amount.toString(),
          price_type: "market",
          limit_price: null,
          content: `I'll help you buy ${amount} ${token}.`,
        }
      } else {
        // Try to extract just the token
        const simpleTokenMatch = userInput.match(/buy\s+([a-zA-Z]+)/i)
        if (simpleTokenMatch) {
          const token = simpleTokenMatch[1].toUpperCase()

          // Get token address for known tokens
          let tokenAddress = null
          if (token === "SOL") {
            tokenAddress = "So11111111111111111111111111111111111111112"
          } else if (token === "USDC") {
            tokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
          } else if (token === "BONK") {
            tokenAddress = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
          }

          response = {
            action: "buy",
            token_symbol: token,
            token_address: tokenAddress,
            content: `How much ${token} would you like to buy?`,
          }
        }
      }
    }
    // Check for sell intent
    else if (userInput.includes("sell")) {
      const tokenMatch = userInput.match(/sell\s+(\d+(\.\d+)?)\s+([a-zA-Z]+)/i)
      if (tokenMatch) {
        const amount = Number.parseFloat(tokenMatch[1])
        const token = tokenMatch[3].toUpperCase()

        // Get token address for known tokens
        let tokenAddress = null
        if (token === "SOL") {
          tokenAddress = "So11111111111111111111111111111111111111112"
        } else if (token === "USDC") {
          tokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        } else if (token === "BONK") {
          tokenAddress = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
        }

        response = {
          action: "sell",
          token_symbol: token,
          token_address: tokenAddress,
          amount: amount.toString(),
          price_type: "market",
          limit_price: null,
          content: `I'll help you sell ${amount} ${token}.`,
        }
      } else {
        // Try to extract just the token
        const simpleTokenMatch = userInput.match(/sell\s+([a-zA-Z]+)/i)
        if (simpleTokenMatch) {
          const token = simpleTokenMatch[1].toUpperCase()

          // Get token address for known tokens
          let tokenAddress = null
          if (token === "SOL") {
            tokenAddress = "So11111111111111111111111111111111111111112"
          } else if (token === "USDC") {
            tokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
          } else if (token === "BONK") {
            tokenAddress = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
          }

          response = {
            action: "sell",
            token_symbol: token,
            token_address: tokenAddress,
            content: `How much ${token} would you like to sell?`,
          }
        }
      }
    }

    // Check for info intent
    else if (userInput.includes("info") || userInput.includes("about") || userInput.includes("tell me about")) {
      // Try to extract token
      const tokenMatch = userInput.match(/(?:info|about|tell me about)\s+([a-zA-Z]+)/i)
      if (tokenMatch) {
        const token = tokenMatch[1].toUpperCase()

        // Get token address for known tokens
        let tokenAddress = null
        if (token === "SOL") {
          tokenAddress = "So11111111111111111111111111111111111111112"
        } else if (token === "USDC") {
          tokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        } else if (token === "BONK") {
          tokenAddress = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
        }

        response = {
          action: "info",
          token_symbol: token,
          token_address: tokenAddress,
          content: `Here's some information about ${token}.`,
        }
      }

      // Check for token address - PRESERVE CASE
      const addressMatch = userInput.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/g)
      if (addressMatch) {
        const tokenAddress = addressMatch[0] // Preserve original case exactly as matched
        response = {
          action: "info",
          token_address: tokenAddress, // Ensuring we use the exact case as matched
          content: `I'll check information about this token address.`,
        }
      }
    }
    // Check for token address in any context - PRESERVE CASE
    else {
      const addressMatch = userInput.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/g)
      if (addressMatch) {
        const tokenAddress = addressMatch[0] // Preserve original case exactly as matched
        response = {
          action: "info",
          token_address: tokenAddress, // Ensuring we use the exact case as matched
          content: `I'll check information about this token address.`,
        }
      }
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in fallback API:", error)
    return NextResponse.json(
      {
        response: {
          action: "message",
          content: "Sorry, there was an error processing your request.",
        },
      },
      { status: 500 },
    )
  }
}
