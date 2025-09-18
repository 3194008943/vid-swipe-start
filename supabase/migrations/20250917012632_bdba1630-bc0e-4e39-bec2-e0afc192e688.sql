-- Drop existing policies that allow anonymous access
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own sent messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies for messages table (authenticated users only)
CREATE POLICY "Authenticated users can view their own messages" 
ON public.messages 
FOR SELECT 
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

CREATE POLICY "Authenticated users can send messages" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Authenticated users can update their own sent messages" 
ON public.messages 
FOR UPDATE 
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Authenticated recipients can mark messages as read" 
ON public.messages 
FOR UPDATE 
TO authenticated
USING (auth.uid() = recipient_id);

-- Create new policies for profiles table (authenticated users only)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);