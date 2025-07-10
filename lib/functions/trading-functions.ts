import { ChatCompletionTool } from "openai/resources/chat/completions";

// Common token properties used across multiple functions
const tokenProperties = {
  token_address: {
    type: "string",
    description: "The Solana address of the token. MUST preserve exact case sensitivity."
  },
  token_symbol: {
    type: "string",
    description: "The symbol of the token (e.g., SOL, USDC, BONK)."
  }
};

// Common trading properties
const tradingProperties = {
  ...tokenProperties,
  amount: {
    type: "string",
    description: "The amount of tokens to trade."
  }
};

// Price condition schema
const priceConditionSchema = {
  type: "object",
  properties: {
    trigger_type: {
      type: "string",
      enum: ["below", "above", "between"],
      description: "The type of price-based trigger."
    },
    price: {
      type: ["number", "null"],
      description: "The specific price for single triggers or the lower bound for range triggers."
    },
    upper_price: {
      type: ["number", "null"],
      description: "The upper bound for range triggers, or null for single triggers."
    }
  },
  required: ["trigger_type", "price"]
};

// Time condition schema
const timeConditionSchema = {
  type: "object",
  properties: {
    time_mode: {
      type: "string",
      enum: ["direct", "relative"],
      description: "Time setting mode: 'direct' for absolute times, 'relative' for base time with offsets."
    },
    // Direct time mode properties
    start_time: {
      type: ["string", "null"],
      description: "The start time for the time window in format 'YYYY-MM-DD HH:MM:SS' or null if not applicable. Used when time_mode is 'direct'."
    },
    end_time: {
      type: ["string", "null"],
      description: "The end time for the time window in format 'YYYY-MM-DD HH:MM:SS' or null if not applicable. Used when time_mode is 'direct'."
    },
    // Relative time mode properties
    base_time: {
      type: ["string", "null"],
      description: "The base time in format 'YYYY-MM-DD HH:MM:SS' to calculate relative times from. Used when time_mode is 'relative'."
    },
    start_offset_minutes: {
      type: ["number", "null"],
      description: "Minutes offset from base_time for start time (positive for future, negative for past). Used when time_mode is 'relative'."
    },
    end_offset_minutes: {
      type: ["number", "null"],
      description: "Minutes offset from base_time for end time (positive for future, negative for past). Used when time_mode is 'relative'."
    }
  },
  required: ["time_mode"],
  oneOf: [
    {
      // Direct time mode validation
      properties: {
        time_mode: { const: "direct" },
        start_time: { type: ["string", "null"] },
        end_time: { type: ["string", "null"] }
      },
      required: ["time_mode"]
    },
    {
      // Relative time mode validation
      properties: {
        time_mode: { const: "relative" },
        base_time: { type: "string" },
        start_offset_minutes: { type: ["number", "null"] },
        end_offset_minutes: { type: ["number", "null"] }
      },
      required: ["time_mode", "base_time"]
    }
  ]
};

// Buy order schema
const buyOrderSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "buy_order",
    description: "Create an order to buy tokens. Can be executed immediately or with conditions.",
    parameters: {
      type: "object",
      properties: {
        ...tradingProperties,
        immediate_execution: {
          type: "boolean",
          description: "If true, execute the buy order immediately without conditions. If false, conditions are required.",
          default: false
        },
        conditions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              condition_type: {
                type: "string",
                enum: ["price", "time"],
                description: "The type of condition to combine."
              },
              condition_details: {
                type: "object",
                oneOf: [priceConditionSchema, timeConditionSchema]
              }
            }
          },
          description: "Array of conditions for the order. Required when immediate_execution is false."
        },
        logic_type: {
          type: "string",
          enum: ["AND", "OR"],
          description: "The logical operator to combine multiple conditions. Required when multiple conditions are provided."
        }
      },
      required: ["token_address", "token_symbol", "amount", "immediate_execution"]
    }
  }
};

// Sell order schema
const sellOrderSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "sell_order",
    description: "Create an order to sell tokens. Can be executed immediately or with conditions.",
    parameters: {
      type: "object",
      properties: {
        ...tradingProperties,
        immediate_execution: {
          type: "boolean",
          description: "If true, execute the sell order immediately without conditions. If false, conditions are required.",
          default: false
        },
        conditions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              condition_type: {
                type: "string",
                enum: ["price", "time"],
                description: "The type of condition to combine."
              },
              condition_details: {
                type: "object",
                oneOf: [priceConditionSchema, timeConditionSchema]
              }
            }
          },
          description: "Array of conditions for the order. Required when immediate_execution is false."
        },
        logic_type: {
          type: "string",
          enum: ["AND", "OR"],
          description: "The logical operator to combine multiple conditions. Required when multiple conditions are provided."
        }
      },
      required: ["token_address", "token_symbol", "amount", "immediate_execution"]
    }
  }
};

// Notify booking schema
const notifyBookingSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "notify_booking",
    description: "Create a booking order to notify with multiple conditions.",
    parameters: {
      type: "object",
      properties: {
        ...tradingProperties,
        conditions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              condition_type: {
                type: "string",
                enum: ["price", "time"],
                description: "The type of condition to combine."
              },
              condition_details: {
                type: "object",
                oneOf: [priceConditionSchema, timeConditionSchema]
              }
            }
          },
          minItems: 1 // Ensures at least one condition must be provided
        },
        logic_type: {
          type: "string",
          enum: ["AND", "OR"],
          description: "The logical operator to combine multiple conditions."
        }
      },
      required: ["token_address", "token_symbol", "amount", "conditions"]
    }
  }
};

// Cancel limit order schema
const cancelLimitOrderSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "cancel_limit_order",
    description: "Cancel a pending limit order.",
    parameters: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The ID of the limit order to cancel."
        }
      },
      required: ["order_id"]
    }
  }
};

// Get limit orders schema
const getLimitOrdersSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "get_limit_orders",
    description: "Get all limit orders for the current user.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["all", "pending", "executed", "cancelled"],
          description: "Filter orders by status."
        }
      },
      required: []
    }
  }
};

// Get token info schema
const getTokenInfoSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "get_token_info",
    description: "Get information about a token on Solana.",
    parameters: {
      type: "object",
      properties: tokenProperties,
      required: ["token_address", "token_symbol"]
    }
  }
};

// Get wallet balance schema
const getWalletBalanceSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "get_wallet_balance",
    description: "Get the overall wallet balance including SOL and all token balances.",
    parameters: {
      type: "object",
      properties: {
        include_tokens: {
          type: "boolean",
          description: "Whether to include token balances in addition to SOL balance."
        }
      },
      required: []
    }
  }
};

// Get wallet portfolio schema
const getWalletPortfolioSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "get_wallet_portfolio",
    description: "Get detailed portfolio information including all holdings, values, and performance.",
    parameters: {
      type: "object",
      properties: {
        include_performance: {
          type: "boolean",
          description: "Whether to include performance metrics and profit/loss data."
        }
      },
      required: []
    }
  }
};

// Get wallet transactions schema
const getWalletTransactionsSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "get_wallet_transactions",
    description: "Get transaction history for the wallet.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of transactions to return (default: 50)."
        },
        transaction_type: {
          type: "string",
          enum: ["all", "buy", "sell", "transfer"],
          description: "Filter transactions by type."
        },
        token_symbol: {
          type: "string",
          description: "Filter transactions by specific token symbol."
        }
      },
      required: []
    }
  }
};

// Get wallet info schema
const getWalletInfoSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "get_wallet_info",
    description: "Get general wallet information including address, creation date, and basic stats.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
};

// Get wallet NFTs schema
const getWalletNFTsSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "get_wallet_nfts",
    description: "Get all NFTs owned by the wallet.",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "Filter NFTs by specific collection."
        }
      },
      required: []
    }
  }
};

// Send message schema
const sendMessageSchema: ChatCompletionTool = {
  type: "function" as const,
  function: {
    name: "send_message",
    description: "Send a general message when no specific action can be determined.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The message content to send to the user."
        }
      },
      required: ["content"]
    }
  }
};

// Trading functions for OpenAI function calling
export const tradingFunctions: ChatCompletionTool[] = [
  getTokenInfoSchema,
  cancelLimitOrderSchema,
  getLimitOrdersSchema,
  getWalletBalanceSchema,
  getWalletPortfolioSchema,
  getWalletTransactionsSchema,
  getWalletInfoSchema,
  getWalletNFTsSchema,
  sendMessageSchema,
  buyOrderSchema,
  sellOrderSchema,
  notifyBookingSchema
];

// Token address reference for common tokens
export const knownTokenAddresses: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
};

// Define the interface for function arguments
interface FunctionArgs {
  token_address?: string;
  token_symbol?: string;
  amount?: string;
  immediate_execution?: boolean;
  content?: string;
  order_id?: string;
  status?: string;
  logic_type?: 'AND' | 'OR';
  conditions?: Array<{
    condition_type: string;
    condition_details: any;
  }>;
  // Time condition properties
  time_mode?: 'direct' | 'relative';
  start_time?: string;
  end_time?: string;
  base_time?: string;
  start_offset_minutes?: number;
  end_offset_minutes?: number;
  // Wallet function arguments
  include_tokens?: boolean;
  include_performance?: boolean;
  limit?: number;
  transaction_type?: string;
  collection?: string;
}

// Helper function to convert function call result to the expected response format
export function convertFunctionCallToResponse(functionName: string, args: FunctionArgs): any {
  switch (functionName) {
    case "buy_order":
      return {
        action: "buy_order",
        token_address: args.token_address,
        token_symbol: args.token_symbol,
        amount: args.amount,
        immediate_execution: args.immediate_execution,
        conditions: args.conditions,
        logic_type: args.logic_type
      };

    case "sell_order":
      return {
        action: "sell_order",
        token_address: args.token_address,
        token_symbol: args.token_symbol,
        amount: args.amount,
        immediate_execution: args.immediate_execution,
        conditions: args.conditions,
        logic_type: args.logic_type
      };

    case "notify_booking":
      return {
        action: "notify_booking",
        token_address: args.token_address,
        token_symbol: args.token_symbol,
        amount: args.amount,
        conditions: args.conditions,
        logic_type: args.logic_type
      };

    case "cancel_order":
      return {
        action: "cancel_order",
        order_id: args.order_id
      };

    case "get_orders":
      return {
        action: "get_orders",
        status: args.status || "all"
      };

    case "get_token_info":
      return {
        action: "info",
        token_address: args.token_address,
        token_symbol: args.token_symbol
      };

    case "send_message":
      return {
        action: "message",
        content: args.content
      };

    case "get_wallet_balance":
      return {
        action: "get_wallet_balance",
        include_tokens: args.include_tokens
      };

    case "get_wallet_portfolio":
      return {
        action: "get_wallet_portfolio",
        include_performance: args.include_performance
      };

    case "get_wallet_transactions":
      return {
        action: "get_wallet_transactions",
        limit: args.limit,
        transaction_type: args.transaction_type,
        token_symbol: args.token_symbol
      };

    case "get_wallet_info":
      return {
        action: "get_wallet_info"
      };

    case "get_wallet_nfts":
      return {
        action: "get_wallet_nfts",
        collection: args.collection
      };

    default:
      return {
        action: "message",
        content: "I couldn't understand that request. Please try something like 'Buy 0.5 SOL' or 'Sell 10 BONK'."
      };
  }
}
