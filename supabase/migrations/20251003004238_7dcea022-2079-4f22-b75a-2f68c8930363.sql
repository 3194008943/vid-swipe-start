-- Fix profile privacy: respect user privacy settings
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles based on privacy settings" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  auth.uid() = id 
  OR 
  -- Public profiles are visible to everyone
  (
    SELECT privacy_profile 
    FROM public.user_settings 
    WHERE user_id = profiles.id
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