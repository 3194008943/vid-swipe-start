-- Grant admin role to your user
INSERT INTO public.user_roles (user_id, role)
VALUES ('2c7de16c-0fea-42fb-bf20-51ae72cc546a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;