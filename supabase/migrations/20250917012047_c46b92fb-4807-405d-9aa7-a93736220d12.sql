-- Drop the existing conversations view with SECURITY DEFINER
DROP VIEW IF EXISTS public.conversations;

-- Recreate the conversations view WITHOUT SECURITY DEFINER
-- This ensures it respects RLS policies from the underlying messages table
CREATE VIEW public.conversations AS
SELECT DISTINCT ON (
  LEAST(m.sender_id, m.recipient_id),
  GREATEST(m.sender_id, m.recipient_id)
)
  CASE 
    WHEN m.sender_id = auth.uid() THEN m.recipient_id
    ELSE m.sender_id
  END AS other_user_id,
  m.content AS last_message,
  m.created_at AS last_message_at,
  m.id AS last_message_id,
  CASE 
    WHEN m.sender_id = auth.uid() THEN 'sent'
    ELSE 'received'
  END AS last_message_type,
  m.read_at,
  LEAST(m.sender_id, m.recipient_id) || '-' || GREATEST(m.sender_id, m.recipient_id) AS conversation_id
FROM messages m
WHERE (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
ORDER BY 
  LEAST(m.sender_id, m.recipient_id),
  GREATEST(m.sender_id, m.recipient_id),
  m.created_at DESC;

-- Add a comment explaining the security model
COMMENT ON VIEW public.conversations IS 'View for user conversations that inherits RLS policies from the messages table. Users can only see conversations they are part of.';