// Define the LimitOrder type for database and API operations
export interface LimitOrder {
  id?: string;
  user_wallet: string;
  token_address: string;
  token_symbol: string;
  action_type: 'buy' | 'sell';
  amount: number | string;
  limit_price: number;
  status: 'pending' | 'executed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  executed_at?: string;
  tx_hash?: string;
  details?: Record<string, any>;
}
