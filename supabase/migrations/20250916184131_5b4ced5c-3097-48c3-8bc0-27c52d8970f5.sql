-- Drop the problematic view with SECURITY DEFINER
DROP VIEW IF EXISTS public.conversations;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.conversations AS
SELECT DISTINCT ON (conversation_id)
  CASE 
    WHEN m.sender_id = auth.uid() THEN m.recipient_id
    ELSE m.sender_id
  END as other_user_id,
  m.id as last_message_id,
  m.content as last_message,
  m.created_at as last_message_at,
  CASE 
    WHEN m.sender_id = auth.uid() THEN 'sent'
    ELSE 'received'
  END as last_message_type,
  m.read_at,
  LEAST(m.sender_id::text, m.recipient_id::text) || '-' || GREATEST(m.sender_id::text, m.recipient_id::text) as conversation_id
FROM public.messages m
WHERE m.sender_id = auth.uid() OR m.recipient_id = auth.uid()
ORDER BY conversation_id, m.created_at DESC;