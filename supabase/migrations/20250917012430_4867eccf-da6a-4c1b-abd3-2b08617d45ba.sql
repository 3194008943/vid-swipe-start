-- Ensure conversations view runs with invoker rights (not definer)
ALTER VIEW IF EXISTS public.conversations SET (security_invoker = true);

-- Document rationale
COMMENT ON VIEW public.conversations IS 'Security INVOKER view so permissions and RLS are evaluated using the querying user. Backed by public.messages with RLS.';