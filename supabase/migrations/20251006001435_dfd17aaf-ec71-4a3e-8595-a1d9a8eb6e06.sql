-- Fix 1: Restrict profile visibility to authenticated users only
-- Update the existing policy to require authentication
DROP POLICY IF EXISTS "Users can view profiles based on privacy settings" ON public.profiles;

CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR 
  (COALESCE((SELECT user_settings.privacy_profile FROM user_settings WHERE user_settings.user_id = profiles.id), 'public') = 'public') OR
  (EXISTS (SELECT 1 FROM follows WHERE follows.following_id = profiles.id AND follows.follower_id = auth.uid()))
);

-- Fix 2: Hide sensitive financial data (gift_total) from public view
-- Create a view that filters out sensitive columns for non-owners
CREATE OR REPLACE FUNCTION public.get_public_live_streams()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  is_live boolean,
  is_pvp boolean,
  viewer_count integer,
  started_at timestamp with time zone,
  thumbnail_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id,
    user_id,
    title,
    description,
    is_live,
    is_pvp,
    viewer_count,
    started_at,
    thumbnail_url,
    created_at
  FROM public.live_streams
  WHERE is_live = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_live_streams() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_live_streams() TO anon;

-- Fix 3: Require authentication for viewing comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;

CREATE POLICY "Authenticated users can view comments"
ON public.comments
FOR SELECT
TO authenticated
USING (true);

-- Fix 4: Require authentication for viewing hashtags
DROP POLICY IF EXISTS "Anyone can view hashtags" ON public.hashtags;

CREATE POLICY "Authenticated users can view hashtags"
ON public.hashtags
FOR SELECT
TO authenticated
USING (true);

-- Fix 5: Require authentication for viewing likes
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;

CREATE POLICY "Authenticated users can view likes"
ON public.likes
FOR SELECT
TO authenticated
USING (true);