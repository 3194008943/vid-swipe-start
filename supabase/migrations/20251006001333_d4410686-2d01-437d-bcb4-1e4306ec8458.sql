-- Drop the existing conversation_view if it exists
DROP VIEW IF EXISTS public.conversation_view;

-- Create a security definer function to get user's conversations
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  last_message text,
  last_message_at timestamp with time zone,
  last_message_type text,
  last_message_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  read_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    c.id as conversation_id,
    CASE 
      WHEN c.participant1_id = auth.uid() THEN c.participant2_id
      ELSE c.participant1_id
    END as other_user_id,
    c.last_message,
    c.last_message_at,
    c.last_message_type,
    c.last_message_id,
    c.created_at,
    c.updated_at,
    c.read_at
  FROM public.conversations c
  WHERE c.participant1_id = auth.uid() 
     OR c.participant2_id = auth.uid()
  ORDER BY c.last_message_at DESC NULLS LAST;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;