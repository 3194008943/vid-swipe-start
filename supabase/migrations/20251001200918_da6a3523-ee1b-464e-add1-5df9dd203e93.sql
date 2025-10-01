-- Fix conversation_view security issue
-- This view should respect the underlying table RLS policies

-- Ensure the view uses security invoker to respect base table RLS
ALTER VIEW public.conversation_view SET (security_invoker = on);

-- Revoke all access from public and anon
REVOKE ALL ON public.conversation_view FROM PUBLIC;
REVOKE ALL ON public.conversation_view FROM anon;

-- Grant SELECT permission only to authenticated users
GRANT SELECT ON public.conversation_view TO authenticated;

-- Create hashtags management for posts
ALTER TABLE public.hashtags
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false;

-- Enable users to create hashtags
CREATE POLICY "Users can create hashtags" 
ON public.hashtags 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Enable users to update trending status (admin only)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
    AND (bio LIKE '%[ADMIN]%' OR bio LIKE '%[STAFF]%')
  );
$$;

-- Create live_streams table for live streaming features
CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  stream_key text UNIQUE,
  stream_url text,
  is_live boolean DEFAULT false,
  is_pvp boolean DEFAULT false,
  pvp_opponent_id uuid REFERENCES auth.users(id),
  viewer_count integer DEFAULT 0,
  gift_total numeric DEFAULT 0,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for live_streams
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Create policies for live_streams
CREATE POLICY "Anyone can view live streams" 
ON public.live_streams 
FOR SELECT 
USING (is_live = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own streams" 
ON public.live_streams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streams" 
ON public.live_streams 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streams" 
ON public.live_streams 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create gifts table for virtual gifts
CREATE TABLE IF NOT EXISTS public.gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon_url text,
  price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for gifts
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active gifts
CREATE POLICY "Anyone can view active gifts" 
ON public.gifts 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage gifts
CREATE POLICY "Admins can manage gifts" 
ON public.gifts 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Create gift_transactions table
CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  gift_id uuid NOT NULL REFERENCES public.gifts(id),
  stream_id uuid REFERENCES public.live_streams(id),
  amount integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for gift_transactions
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their transactions" 
ON public.gift_transactions 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send gifts
CREATE POLICY "Users can send gifts" 
ON public.gift_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Create pvp_battles table
CREATE TABLE IF NOT EXISTS public.pvp_battles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id uuid NOT NULL REFERENCES auth.users(id),
  opponent_id uuid NOT NULL REFERENCES auth.users(id),
  challenger_stream_id uuid REFERENCES public.live_streams(id),
  opponent_stream_id uuid REFERENCES public.live_streams(id),
  challenger_votes integer DEFAULT 0,
  opponent_votes integer DEFAULT 0,
  challenger_gifts numeric DEFAULT 0,
  opponent_gifts numeric DEFAULT 0,
  winner_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for pvp_battles
ALTER TABLE public.pvp_battles ENABLE ROW LEVEL SECURITY;

-- Anyone can view active battles
CREATE POLICY "Anyone can view battles" 
ON public.pvp_battles 
FOR SELECT 
USING (true);

-- Users can create battles they're part of
CREATE POLICY "Users can create battles" 
ON public.pvp_battles 
FOR INSERT 
WITH CHECK (auth.uid() = challenger_id);

-- Participants can update battles
CREATE POLICY "Participants can update battles" 
ON public.pvp_battles 
FOR UPDATE 
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Create user_settings table for enhanced settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  language text DEFAULT 'en',
  autoplay_videos boolean DEFAULT true,
  data_saver_mode boolean DEFAULT false,
  notification_videos boolean DEFAULT true,
  notification_live boolean DEFAULT true,
  notification_pvp boolean DEFAULT true,
  notification_gifts boolean DEFAULT true,
  privacy_profile text DEFAULT 'public' CHECK (privacy_profile IN ('public', 'friends', 'private')),
  privacy_comments text DEFAULT 'everyone' CHECK (privacy_comments IN ('everyone', 'friends', 'none')),
  privacy_gifts text DEFAULT 'everyone' CHECK (privacy_gifts IN ('everyone', 'friends', 'none')),
  two_factor_enabled boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own settings
CREATE POLICY "Users can view their settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger to auto-create user settings on signup
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_settings();

-- Add update triggers for all new tables
CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();