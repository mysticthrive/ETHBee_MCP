-- Fix RLS policies for booking_orders table
-- This migration updates the RLS policies to work with the service role properly

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to booking_orders" ON booking_orders;
DROP POLICY IF EXISTS "Allow service_role to insert booking_orders" ON booking_orders;
DROP POLICY IF EXISTS "Allow service_role to update booking_orders" ON booking_orders;
DROP POLICY IF EXISTS "Allow service_role to delete booking_orders" ON booking_orders;

-- Create new policies that work with service role authentication

-- Allow service role to read all booking orders
CREATE POLICY "Allow service_role read access to booking_orders"
  ON booking_orders FOR SELECT
  TO service_role
  USING (true);

-- Allow authenticated users to read their own booking orders
CREATE POLICY "Allow users to read own booking_orders"
  ON booking_orders FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_wallet OR auth.role() = 'service_role');

-- Allow public read access for monitoring (optional - remove if not needed)
CREATE POLICY "Allow public read access to booking_orders"
  ON booking_orders FOR SELECT
  TO anon
  USING (true);

-- Allow service role to insert booking orders
CREATE POLICY "Allow service_role to insert booking_orders"
  ON booking_orders FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own booking orders
CREATE POLICY "Allow users to insert own booking_orders"
  ON booking_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_wallet OR auth.role() = 'service_role');

-- Allow service role to update booking orders
CREATE POLICY "Allow service_role to update booking_orders"
  ON booking_orders FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to update their own booking orders
CREATE POLICY "Allow users to update own booking_orders"
  ON booking_orders FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_wallet OR auth.role() = 'service_role')
  WITH CHECK (auth.uid()::text = user_wallet OR auth.role() = 'service_role');

-- Allow service role to delete booking orders
CREATE POLICY "Allow service_role to delete booking_orders"
  ON booking_orders FOR DELETE
  TO service_role
  USING (true);

-- Allow authenticated users to delete their own booking orders
CREATE POLICY "Allow users to delete own booking_orders"
  ON booking_orders FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_wallet OR auth.role() = 'service_role');

-- Add comment explaining the policy structure
COMMENT ON TABLE booking_orders IS 'Booking orders table with RLS policies allowing service role full access and users access to their own orders';
