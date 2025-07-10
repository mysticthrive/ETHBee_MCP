// Types for our database tables
export type TokenData = {
  id?: string; // Primary key (UUID)
  address: string; // Token address
  symbol: string; // Token symbol
  name: string; // Token name
  decimals?: number; // Token decimals
  price_usd?: number; // Current price in USD
  price_change_24h?: number; // 24h price change percentage
  market_cap?: number; // Market cap in USD
  total_supply?: number; // Total supply
  created_at?: string; // Creation timestamp
  updated_at?: string; // Last update timestamp
  logo_url?: string; // URL to token logo
  metadata?: any; // Additional metadata as JSON
};

export type TransactionData = {
  id?: string; // Primary key (UUID)
  tx_hash?: string; // Transaction hash
  user_wallet?: string; // User's wallet address
  user_id?: string; // Reference to the user who owns this transaction
  action_type: 'buy' | 'sell' | 'stake' | 'unstake' | 'approve' | 'check_balance' | 'info' |
               'notify' | 'buy_booking' | 'sell_booking' | 'notify_booking' |
               'cancel_limit_order' | 'get_limit_orders' | 'get_token_info'; // Type of action
  token_address: string; // Token address
  token_symbol: string; // Token symbol
  in_amount?: number; // Amount of tokens
  out_amount?: number; // Amount of tokens
  swap_usd_value?: number; // Price in USD at transaction time
  status: 'pending' | 'success' | 'failed'; // Transaction status
  created_at?: string; // Creation timestamp
  updated_at?: string; // Last update timestamp
  details?: any; // Additional details as JSON
}; 