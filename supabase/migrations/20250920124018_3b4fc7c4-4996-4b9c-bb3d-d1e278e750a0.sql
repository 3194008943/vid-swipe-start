-- Fix security definer view issue
-- Drop the existing view if it has SECURITY DEFINER
DROP VIEW IF EXISTS public.conversation_view;

-- Recreate the view without SECURITY DEFINER (using SECURITY INVOKER which is the default)
-- This ensures the view runs with the permissions of the querying user, respecting RLS
CREATE OR REPLACE VIEW public.conversation_view AS
SELECT 
  CASE 
    WHEN c.participant1_id = auth.uid() THEN c.id
    WHEN c.participant2_id = auth.uid() THEN c.id
    ELSE NULL
  END AS conversation_id,
  CASE 
    WHEN c.participant1_id = auth.uid() THEN c.participant2_id
    WHEN c.participant2_id = auth.uid() THEN c.participant1_id
    ELSE NULL
  END AS other_user_id,
  c.last_message,
  c.last_message_at,
  c.last_message_id,
  c.last_message_type,
  c.read_at,
  c.created_at,
  c.updated_at
FROM public.conversations c
WHERE c.participant1_id = auth.uid() OR c.participant2_id = auth.uid();

-- Grant appropriate permissions
GRANT SELECT ON public.conversation_view TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.conversation_view IS 'View for conversations that respects RLS by only showing conversations where the current user is a participant. Uses SECURITY INVOKER (default) to ensure queries run with the permissions of the querying user.';