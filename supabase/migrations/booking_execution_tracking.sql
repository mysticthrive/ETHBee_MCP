-- Add execution tracking fields to booking_orders table
ALTER TABLE booking_orders 
ADD COLUMN IF NOT EXISTS execution_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_execution_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS execution_error TEXT,
ADD COLUMN IF NOT EXISTS monitoring_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS condition_evaluation_count INTEGER DEFAULT 0;

-- Create index for monitoring queries
CREATE INDEX IF NOT EXISTS idx_booking_orders_monitoring 
ON booking_orders(status, monitoring_started_at) 
WHERE status = 'pending';

-- Create index for execution tracking
CREATE INDEX IF NOT EXISTS idx_booking_orders_execution_attempts 
ON booking_orders(execution_attempts, last_execution_attempt) 
WHERE status = 'pending';

-- Create a function to update condition evaluation count
CREATE OR REPLACE FUNCTION increment_condition_evaluation_count(order_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE booking_orders 
  SET condition_evaluation_count = condition_evaluation_count + 1,
      last_checked_at = NOW()
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to track execution attempts
CREATE OR REPLACE FUNCTION track_execution_attempt(
  order_id UUID, 
  success BOOLEAN, 
  error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE booking_orders 
  SET execution_attempts = execution_attempts + 1,
      last_execution_attempt = NOW(),
      execution_error = CASE WHEN success THEN NULL ELSE error_message END,
      status = CASE WHEN success THEN 'executed' ELSE status END
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- Create booking_order_events table for detailed tracking
CREATE TABLE IF NOT EXISTS booking_order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_order_id UUID NOT NULL REFERENCES booking_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'condition_checked', 'condition_met', 'execution_started', 
    'execution_completed', 'execution_failed', 'cancelled', 'expired'
  )),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for booking_order_events
CREATE INDEX IF NOT EXISTS idx_booking_order_events_order_id 
ON booking_order_events(booking_order_id);

CREATE INDEX IF NOT EXISTS idx_booking_order_events_type_time 
ON booking_order_events(event_type, created_at);

-- Create a function to log booking order events
CREATE OR REPLACE FUNCTION log_booking_order_event(
  order_id UUID,
  event_type TEXT,
  event_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO booking_order_events (booking_order_id, event_type, event_data)
  VALUES (order_id, event_type, event_data)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for booking_order_events
ALTER TABLE booking_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to booking_order_events" 
  ON booking_order_events FOR SELECT 
  USING (true);

CREATE POLICY "Allow service_role to manage booking_order_events" 
  ON booking_order_events FOR ALL 
  TO service_role 
  USING (true);

-- Create a view for booking order monitoring dashboard
CREATE OR REPLACE VIEW booking_orders_monitoring_view AS
SELECT 
  bo.id,
  bo.user_wallet,
  bo.token_symbol,
  bo.action_type,
  bo.amount,
  bo.status,
  bo.created_at,
  bo.expires_at,
  bo.last_checked_at,
  bo.check_count,
  bo.condition_evaluation_count,
  bo.execution_attempts,
  bo.last_execution_attempt,
  bo.execution_error,
  bo.conditions,
  bo.logic_type,
  CASE 
    WHEN bo.expires_at < NOW() THEN 'expired'
    WHEN bo.status = 'pending' AND bo.last_checked_at < NOW() - INTERVAL '5 minutes' THEN 'stale'
    ELSE bo.status
  END as computed_status,
  (
    SELECT COUNT(*) 
    FROM booking_order_events boe 
    WHERE boe.booking_order_id = bo.id 
    AND boe.event_type = 'condition_met'
  ) as conditions_met_count,
  (
    SELECT MAX(boe.created_at) 
    FROM booking_order_events boe 
    WHERE boe.booking_order_id = bo.id
  ) as last_event_time
FROM booking_orders bo
WHERE bo.status IN ('pending', 'executing')
ORDER BY bo.created_at DESC;

-- Add comments for documentation
COMMENT ON TABLE booking_order_events IS 'Detailed event log for booking order lifecycle tracking';
COMMENT ON COLUMN booking_order_events.event_type IS 'Type of event: created, condition_checked, condition_met, execution_started, execution_completed, execution_failed, cancelled, expired';
COMMENT ON COLUMN booking_order_events.event_data IS 'Additional data related to the event (condition values, execution details, etc.)';
COMMENT ON VIEW booking_orders_monitoring_view IS 'Comprehensive view for monitoring booking orders with computed status and event counts';
