-- Secure conversation_view to respect underlying RLS and restrict access
-- 1) Ensure the view executes with the caller's privileges so base table RLS applies
ALTER VIEW public.conversation_view SET (security_invoker = true);

-- 2) Tighten privileges: remove broad access and grant only what is needed
REVOKE ALL ON public.conversation_view FROM PUBLIC;
REVOKE ALL ON public.conversation_view FROM anon;
REVOKE ALL ON public.conversation_view FROM authenticated;
GRANT SELECT ON public.conversation_view TO authenticated;

-- Notes:
-- - conversations and messages tables already have RLS limiting access to participants only
-- - With security_invoker = true, selecting from the view will be filtered by those RLS policies
-- - We explicitly avoid granting any access to the anon role