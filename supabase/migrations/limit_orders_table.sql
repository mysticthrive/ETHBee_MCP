-- Create limit_orders table
CREATE TABLE IF NOT EXISTS limit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('buy', 'sell')),
  amount DECIMAL(36, 18) NOT NULL,
  limit_price DECIMAL(24, 12) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'executed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  tx_hash TEXT,
  details JSONB
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_limit_orders_user_wallet ON limit_orders(user_wallet);
CREATE INDEX IF NOT EXISTS idx_limit_orders_token_status ON limit_orders(token_address, status);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE limit_orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read limit orders
CREATE POLICY "Allow public read access to limit_orders" 
  ON limit_orders FOR SELECT 
  USING (true);

-- Only allow authenticated users with service_role to insert limit orders
CREATE POLICY "Allow service_role to insert limit_orders" 
  ON limit_orders FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Only allow authenticated users with service_role to update limit orders
CREATE POLICY "Allow service_role to update limit_orders" 
  ON limit_orders FOR UPDATE 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Only allow authenticated users with service_role to delete limit orders
CREATE POLICY "Allow service_role to delete limit_orders" 
  ON limit_orders FOR DELETE 
  TO service_role 
  USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_limit_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_limit_orders_updated_at
BEFORE UPDATE ON limit_orders
FOR EACH ROW
EXECUTE FUNCTION update_limit_orders_updated_at();

-- Add comments to the table and columns for better documentation
COMMENT ON TABLE limit_orders IS 'Stores limit orders for buying and selling tokens at specific prices';
COMMENT ON COLUMN limit_orders.id IS 'Unique identifier for the limit order';
COMMENT ON COLUMN limit_orders.user_wallet IS 'Wallet address of the user who created the order';
COMMENT ON COLUMN limit_orders.token_address IS 'Contract address of the token';
COMMENT ON COLUMN limit_orders.token_symbol IS 'Symbol of the token (e.g., SOL, ETH)';
COMMENT ON COLUMN limit_orders.action_type IS 'Type of order: buy or sell';
COMMENT ON COLUMN limit_orders.amount IS 'Amount of tokens to buy or sell';
COMMENT ON COLUMN limit_orders.limit_price IS 'Target price at which to execute the order';
COMMENT ON COLUMN limit_orders.status IS 'Current status of the order: pending, executed, or cancelled';
COMMENT ON COLUMN limit_orders.created_at IS 'When the order was created';
COMMENT ON COLUMN limit_orders.updated_at IS 'When the order was last updated';
COMMENT ON COLUMN limit_orders.executed_at IS 'When the order was executed (if applicable)';
COMMENT ON COLUMN limit_orders.tx_hash IS 'Transaction hash of the execution (if applicable)';
COMMENT ON COLUMN limit_orders.details IS 'Additional details about the order in JSON format';
