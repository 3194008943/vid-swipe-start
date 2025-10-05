-- Add social links to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add more diverse gifts (TikTok-style) with proper UUIDs
INSERT INTO public.gifts (name, price, icon_url, is_active) VALUES
('Panda', 200, '🐼', true),
('Lion', 250, '🦁', true),
('Dolphin', 300, '🐬', true),
('Unicorn', 350, '🦄', true),
('Butterfly', 100, '🦋', true),
('Fireworks', 150, '🎆', true),
('Confetti', 75, '🎊', true),
('Party Hat', 50, '🥳', true),
('Cake', 60, '🎂', true),
('Sports Car', 500, '🏎️', true),
('Private Jet', 1000, '✈️', true),
('Yacht', 2000, '🛥️', true),
('Castle', 3000, '🏰', true),
('Crown', 450, '👑', true),
('Galaxy', 800, '🌌', true),
('Meteor Shower', 700, '☄️', true),
('Golden Star', 250, '⭐', true),
('Kiss', 25, '💋', true),
('Love Balloon', 30, '🎈', true),
('Gift Box', 80, '🎁', true);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_payment_intent_id TEXT,
  amount NUMERIC NOT NULL,
  coins INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id),
  stripe_refund_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own refunds"
  ON public.refunds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.payment_transactions
    WHERE payment_transactions.id = refunds.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  ));

CREATE POLICY "Users can request refunds"
  ON public.refunds FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.payment_transactions
    WHERE payment_transactions.id = refunds.payment_transaction_id
    AND payment_transactions.user_id = auth.uid()
  ));

-- Triggers
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();