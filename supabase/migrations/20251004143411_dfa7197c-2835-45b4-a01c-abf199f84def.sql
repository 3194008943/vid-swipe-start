-- Add more diverse gift options for users
INSERT INTO gifts (name, price, icon_url, is_active) VALUES
  ('Rose', 1, '🌹', true),
  ('Heart', 2, '❤️', true),
  ('Star', 5, '⭐', true),
  ('Diamond', 10, '💎', true),
  ('Crown', 20, '👑', true),
  ('Fire', 15, '🔥', true),
  ('Trophy', 50, '🏆', true),
  ('Rocket', 100, '🚀', true),
  ('Castle', 200, '🏰', true),
  ('Unicorn', 500, '🦄', true),
  ('Sports Car', 1000, '🏎️', true),
  ('Island', 5000, '🏝️', true);

-- Create a coins/balance table for virtual currency
CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_coins
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;

-- Users can view their own coins
CREATE POLICY "Users can view their own coins"
ON user_coins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own coins (for transactions)
CREATE POLICY "Users can update their own coins"
ON user_coins
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_user_coins_updated_at
  BEFORE UPDATE ON user_coins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize coins for new users
CREATE OR REPLACE FUNCTION create_user_coins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, balance)
  VALUES (new.id, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger to create coins when user signs up
CREATE TRIGGER on_auth_user_created_coins
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_coins();