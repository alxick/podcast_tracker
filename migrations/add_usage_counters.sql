-- Migration: Add usage counters to users table
-- Run this in your Supabase SQL editor

-- Add usage counter columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS podcasts_tracked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_analyses_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS charts_accessed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Create function to reset monthly counters
CREATE OR REPLACE FUNCTION reset_monthly_counters()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET 
    ai_analyses_used = 0,
    charts_accessed = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can perform action
CREATE OR REPLACE FUNCTION can_perform_action(
  user_id UUID,
  action_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get user plan
  SELECT plan INTO user_plan FROM users WHERE id = user_id;
  
  -- Get current count based on action type
  CASE action_type
    WHEN 'track_podcast' THEN
      SELECT podcasts_tracked INTO current_count FROM users WHERE id = user_id;
    WHEN 'ai_analysis' THEN
      SELECT ai_analyses_used INTO current_count FROM users WHERE id = user_id;
    WHEN 'access_charts' THEN
      SELECT charts_accessed INTO current_count FROM users WHERE id = user_id;
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Get max allowed based on plan
  CASE user_plan
    WHEN 'free' THEN
      CASE action_type
        WHEN 'track_podcast' THEN max_allowed := 3;
        WHEN 'ai_analysis' THEN max_allowed := 1;
        WHEN 'access_charts' THEN max_allowed := 10;
        ELSE max_allowed := 0;
      END CASE;
    WHEN 'starter' THEN
      CASE action_type
        WHEN 'track_podcast' THEN max_allowed := 10;
        WHEN 'ai_analysis' THEN max_allowed := 10;
        WHEN 'access_charts' THEN max_allowed := 50;
        ELSE max_allowed := 0;
      END CASE;
    WHEN 'pro' THEN
      CASE action_type
        WHEN 'track_podcast' THEN max_allowed := 50;
        WHEN 'ai_analysis' THEN max_allowed := 999999; -- Unlimited
        WHEN 'access_charts' THEN max_allowed := 999999; -- Unlimited
        ELSE max_allowed := 0;
      END CASE;
    WHEN 'agency' THEN
      max_allowed := 999999; -- Unlimited for all actions
    ELSE
      max_allowed := 0;
  END CASE;
  
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage_counter(
  user_id UUID,
  action_type TEXT
)
RETURNS void AS $$
BEGIN
  CASE action_type
    WHEN 'track_podcast' THEN
      UPDATE users SET podcasts_tracked = podcasts_tracked + 1 WHERE id = user_id;
    WHEN 'ai_analysis' THEN
      UPDATE users SET ai_analyses_used = ai_analyses_used + 1 WHERE id = user_id;
    WHEN 'access_charts' THEN
      UPDATE users SET charts_accessed = charts_accessed + 1 WHERE id = user_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;
