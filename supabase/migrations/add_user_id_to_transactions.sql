-- Add user_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN user_id UUID REFERENCES users(id);

-- Create an index for faster user-based queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Create a view for user transactions that includes both user_id and wallet information
CREATE OR REPLACE VIEW user_transactions AS
SELECT 
    t.*,
    u.email,
    w.wallet_address
FROM transactions t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN wallets w ON t.user_wallet = w.wallet_address;

-- Add comment to explain the new column
COMMENT ON COLUMN transactions.user_id IS 'Reference to the user who owns this transaction';

-- Update RLS policies to include user_id
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (
    auth.uid() = user_id OR
    user_wallet IN (
        SELECT wallet_address 
        FROM wallets 
        WHERE user_id = auth.uid()
    )
); 