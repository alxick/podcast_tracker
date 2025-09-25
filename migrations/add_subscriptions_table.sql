-- Migration: Add subscriptions table and fix plan persistence
-- Run this in your Supabase SQL editor

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON subscriptions
  FOR ALL USING (true);

-- Create function to get current active subscription for user
CREATE OR REPLACE FUNCTION get_user_active_subscription(user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan TEXT,
  status TEXT,
  current_period_end TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan,
    s.status,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = user_id 
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user plan based on subscription
CREATE OR REPLACE FUNCTION update_user_plan_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user plan based on subscription status
  IF NEW.status = 'active' THEN
    UPDATE users 
    SET plan = NEW.plan 
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'past_due', 'unpaid', 'incomplete') THEN
    UPDATE users 
    SET plan = 'free' 
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user plan when subscription changes
CREATE TRIGGER update_user_plan_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_plan_from_subscription();

-- Create function to sync existing users with their subscriptions
CREATE OR REPLACE FUNCTION sync_user_plans_with_subscriptions()
RETURNS void AS $$
BEGIN
  -- Update users who have active subscriptions
  UPDATE users 
  SET plan = s.plan
  FROM subscriptions s
  WHERE users.id = s.user_id 
    AND s.status = 'active'
    AND users.plan != s.plan;
    
  -- Set users without active subscriptions to free
  UPDATE users 
  SET plan = 'free'
  WHERE id NOT IN (
    SELECT DISTINCT user_id 
    FROM subscriptions 
    WHERE status = 'active'
  )
  AND plan != 'free';
END;
$$ LANGUAGE plpgsql;

-- Run the sync function to fix existing data
SELECT sync_user_plans_with_subscriptions();
