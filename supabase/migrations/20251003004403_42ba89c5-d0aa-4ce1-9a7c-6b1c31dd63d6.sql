-- Fix the profile RLS policy to handle NULL cases properly
DROP POLICY IF EXISTS "Users can view profiles based on privacy settings" ON public.profiles;

CREATE POLICY "Users can view profiles based on privacy settings" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  auth.uid() = id 
  OR 
  -- Public profiles are visible to everyone (default to public if no settings)
  COALESCE(
    (SELECT privacy_profile FROM public.user_settings WHERE user_id = profiles.id),
    'public'
  ) = 'public'
  OR
  -- Private profiles are visible to followers
  EXISTS (
    SELECT 1 
    FROM public.follows 
    WHERE following_id = profiles.id 
    AND follower_id = auth.uid()
  )
);