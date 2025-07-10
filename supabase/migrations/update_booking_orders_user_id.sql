-- Update booking_orders table to use user_id instead of user_wallet
-- First, add the new user_id column
ALTER TABLE booking_orders ADD COLUMN user_id UUID;

-- Create index for the new user_id column
CREATE INDEX IF NOT EXISTS idx_booking_orders_user_id ON booking_orders(user_id);

-- Update the RLS policies to use user_id
DROP POLICY IF EXISTS "Allow public read access to booking_orders" ON booking_orders;
DROP POLICY IF EXISTS "Allow service_role to insert booking_orders" ON booking_orders;
DROP POLICY IF EXISTS "Allow service_role to update booking_orders" ON booking_orders;
DROP POLICY IF EXISTS "Allow service_role to delete booking_orders" ON booking_orders;

-- Create new RLS policies for user_id
CREATE POLICY "Allow users to read their own booking_orders"
  ON booking_orders FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Allow service_role to insert booking_orders"
  ON booking_orders FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own booking_orders"
  ON booking_orders FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Allow users to delete their own booking_orders"
  ON booking_orders FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Update comments
COMMENT ON COLUMN booking_orders.user_id IS 'UUID of the user who created the order (references auth.users)';
COMMENT ON COLUMN booking_orders.user_wallet IS 'Wallet address of the user (kept for reference, but user_id is primary)';
