-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash TEXT,
  user_wallet TEXT,
  action_type TEXT NOT NULL CHECK (
    action_type IN (
      'buy', 'sell', 'swap', 'stake', 'unstake', 'approve', 'check_balance', 
      'set_alert', 'info', 'notify', 'buy_booking', 'sell_booking', 
      'notify_booking', 'cancel_limit_order', 'get_limit_orders', 'get_token_info'
    )
  ),
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  in_amount DECIMAL(36, 18),
  out_amount DECIMAL(36, 18),
  swap_usd_value DECIMAL(24, 12),
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'success', 'failed')
  ),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_wallet for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_wallet ON transactions(user_wallet);

-- Create index on token_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_token_address ON transactions(token_address);

-- Create index on tx_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);

-- Create index on action_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_action_type ON transactions(action_type);

-- Create index on status for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read transactions
CREATE POLICY "Allow public read access to transactions"
  ON transactions FOR SELECT
  USING (true);

-- Only allow authenticated users with service_role to insert/update/delete
CREATE POLICY "Allow service_role to insert transactions"
  ON transactions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service_role to update transactions"
  ON transactions FOR UPDATE
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role to delete transactions"
  ON transactions FOR DELETE
  TO service_role
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
