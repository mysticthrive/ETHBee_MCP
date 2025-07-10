-- Create booking_orders table for advanced conditional orders
CREATE TABLE IF NOT EXISTS booking_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('buy_booking', 'sell_booking', 'notify_booking')),
  amount DECIMAL(36, 18),

  -- Conditions array (stored as JSONB)
  conditions JSONB NOT NULL,
  logic_type TEXT NOT NULL CHECK (logic_type IN ('AND', 'OR')) DEFAULT 'AND',

  -- Status and execution
  status TEXT NOT NULL CHECK (status IN ('pending', 'executed', 'cancelled', 'expired')) DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Execution details
  tx_hash TEXT,
  execution_price DECIMAL(24, 12),
  execution_details JSONB,

  -- Monitoring metadata
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_count INTEGER DEFAULT 0,

  -- Additional details
  details JSONB
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_booking_orders_user_wallet ON booking_orders(user_wallet);
CREATE INDEX IF NOT EXISTS idx_booking_orders_status ON booking_orders(status);
CREATE INDEX IF NOT EXISTS idx_booking_orders_token_status ON booking_orders(token_address, status);
CREATE INDEX IF NOT EXISTS idx_booking_orders_action_status ON booking_orders(action_type, status);
CREATE INDEX IF NOT EXISTS idx_booking_orders_last_checked ON booking_orders(last_checked_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_booking_orders_expires_at ON booking_orders(expires_at) WHERE status = 'pending';

-- Create a GIN index for JSONB conditions for efficient condition queries
CREATE INDEX IF NOT EXISTS idx_booking_orders_conditions ON booking_orders USING GIN (conditions);

-- Add RLS (Row Level Security) policies
ALTER TABLE booking_orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read booking orders
CREATE POLICY "Allow public read access to booking_orders"
  ON booking_orders FOR SELECT
  USING (true);

-- Only allow authenticated users with service_role to insert booking orders
CREATE POLICY "Allow service_role to insert booking_orders"
  ON booking_orders FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only allow authenticated users with service_role to update booking orders
CREATE POLICY "Allow service_role to update booking_orders"
  ON booking_orders FOR UPDATE
  TO service_role
  USING (true);

-- Only allow authenticated users with service_role to delete booking orders
CREATE POLICY "Allow service_role to delete booking_orders"
  ON booking_orders FOR DELETE
  TO service_role
  USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_booking_orders_updated_at
  BEFORE UPDATE ON booking_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_orders_updated_at();

-- Add comments for documentation
COMMENT ON TABLE booking_orders IS 'Stores advanced booking orders with complex conditions (price, time, market)';
COMMENT ON COLUMN booking_orders.id IS 'Unique identifier for the booking order';
COMMENT ON COLUMN booking_orders.user_wallet IS 'Wallet address of the user who created the order';
COMMENT ON COLUMN booking_orders.token_address IS 'Contract address of the primary token';
COMMENT ON COLUMN booking_orders.token_symbol IS 'Symbol of the primary token';
COMMENT ON COLUMN booking_orders.action_type IS 'Type of booking order: buy_booking, sell_booking, notify_booking';
COMMENT ON COLUMN booking_orders.amount IS 'Amount of tokens for the order';
COMMENT ON COLUMN booking_orders.conditions IS 'Array of conditions that must be met (price, time, market)';
COMMENT ON COLUMN booking_orders.logic_type IS 'How to combine multiple conditions: AND or OR';
COMMENT ON COLUMN booking_orders.status IS 'Current status: pending, executed, cancelled, expired';
COMMENT ON COLUMN booking_orders.last_checked_at IS 'When this order was last checked by the monitoring system';
COMMENT ON COLUMN booking_orders.check_count IS 'Number of times this order has been checked';
