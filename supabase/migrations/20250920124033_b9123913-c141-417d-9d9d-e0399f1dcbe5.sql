-- Fix security issue: Protect conversation_view from unauthorized access
-- The view itself doesn't have RLS, but we can control access through permissions and the underlying table's RLS

-- First, revoke all existing permissions on the view
REVOKE ALL ON public.conversation_view FROM public;
REVOKE ALL ON public.conversation_view FROM anon;
REVOKE ALL ON public.conversation_view FROM authenticated;

-- Only grant SELECT permission to authenticated users
-- The view already filters by auth.uid() in its WHERE clause, providing row-level security
GRANT SELECT ON public.conversation_view TO authenticated;

-- Ensure the underlying conversations table has proper RLS (already exists but let's verify)
-- Drop and recreate policies to ensure they're properly configured
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations they're part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they're part of" ON public.conversations;

-- Recreate policies with proper security
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

-- Add a policy to prevent deletion of conversations (preserve message history)
CREATE POLICY "Prevent conversation deletion" 
ON public.conversations 
FOR DELETE 
TO authenticated
USING (false);

-- Update the view definition to be more explicit about security
DROP VIEW IF EXISTS public.conversation_view;

CREATE VIEW public.conversation_view 
WITH (security_invoker = true) -- Explicitly set security invoker
AS
SELECT 
  c.id AS conversation_id,
  CASE 
    WHEN c.participant1_id = auth.uid() THEN c.participant2_id
    WHEN c.participant2_id = auth.uid() THEN c.participant1_id
  END AS other_user_id,
  c.last_message,
  c.last_message_at,
  c.last_message_id,
  c.last_message_type,
  c.read_at,
  c.created_at,
  c.updated_at
FROM public.conversations c
WHERE (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  AND auth.uid() IS NOT NULL; -- Extra safety check

-- Grant SELECT permission only to authenticated users
GRANT SELECT ON public.conversation_view TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.conversation_view IS 'Secure view for conversations that only shows conversations where the authenticated user is a participant. Uses security_invoker to respect RLS policies of underlying tables.';

-- Also ensure messages table has proper RLS
DROP POLICY IF EXISTS "Authenticated users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can update their own sent messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated recipients can mark messages as read" ON public.messages;

-- Recreate message policies with explicit role specification
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

-- Prevent message deletion to preserve conversation history
CREATE POLICY "Prevent message deletion" 
ON public.messages 
FOR DELETE 
TO authenticated
USING (false);

-- Add indexes for better performance on conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);