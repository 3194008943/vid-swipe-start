-- Fix security issue: Protect conversation_view from unauthorized access
-- Handle existing policies gracefully

-- First, revoke all existing permissions on the view
REVOKE ALL ON public.conversation_view FROM public;
REVOKE ALL ON public.conversation_view FROM anon;
REVOKE ALL ON public.conversation_view FROM authenticated;

-- Only grant SELECT permission to authenticated users
GRANT SELECT ON public.conversation_view TO authenticated;

-- Recreate conversation policies with proper TO clause for authenticated role only
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations they're part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they're part of" ON public.conversations;
DROP POLICY IF EXISTS "Prevent conversation deletion" ON public.conversations;

CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
TO authenticated
USING ((auth.uid() = participant1_id) OR (auth.uid() = participant2_id));

CREATE POLICY "Users can create conversations they're part of" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK ((auth.uid() = participant1_id) OR (auth.uid() = participant2_id));

CREATE POLICY "Users can update conversations they're part of" 
ON public.conversations 
FOR UPDATE 
TO authenticated
USING ((auth.uid() = participant1_id) OR (auth.uid() = participant2_id))
WITH CHECK ((auth.uid() = participant1_id) OR (auth.uid() = participant2_id));

CREATE POLICY "Prevent conversation deletion" 
ON public.conversations 
FOR DELETE 
TO authenticated
USING (false);

-- Recreate message policies with proper TO clause
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own sent messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
DROP POLICY IF EXISTS "Prevent message deletion" ON public.messages;

CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own sent messages" 
ON public.messages 
FOR UPDATE 
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read" 
ON public.messages 
FOR UPDATE 
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Prevent message deletion" 
ON public.messages 
FOR DELETE 
TO authenticated
USING (false);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);

-- Update comment on view
COMMENT ON VIEW public.conversation_view IS 'Secure view for conversations that only shows conversations where the authenticated user is a participant. Access restricted to authenticated users only.';