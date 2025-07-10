-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  decimals INTEGER,
  price_usd DECIMAL(24, 12),
  price_change_24h DECIMAL(12, 6),
  market_cap DECIMAL(24, 12),
  total_supply DECIMAL(36, 18),
  logo_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_tokens_address ON tokens(address);

-- Create index on symbol for faster lookups
CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);

-- Add RLS (Row Level Security) policies
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tokens
CREATE POLICY "Allow public read access to tokens" 
  ON tokens FOR SELECT 
  USING (true);

-- Only allow authenticated users with service_role to insert tokens
CREATE POLICY "Allow service_role to insert tokens" 
  ON tokens FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Only allow authenticated users with service_role to update tokens
CREATE POLICY "Allow service_role to update tokens" 
  ON tokens FOR UPDATE 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Only allow authenticated users with service_role to delete tokens
CREATE POLICY "Allow service_role to delete tokens" 
  ON tokens FOR DELETE 
  TO service_role 
  USING (true);
