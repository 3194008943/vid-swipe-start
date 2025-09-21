-- Secure conversation_view without breaking existing queries
BEGIN;

-- Ensure the view executes with caller's privileges so RLS on base tables (conversations/messages) is enforced
ALTER VIEW public.conversation_view SET (security_invoker = on);

-- Lock down direct access: only authenticated users may read from this view
REVOKE ALL ON public.conversation_view FROM PUBLIC;
REVOKE ALL ON public.conversation_view FROM anon;
GRANT SELECT ON public.conversation_view TO authenticated;

COMMIT;