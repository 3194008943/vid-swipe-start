-- Create missing profile and settings for existing user
INSERT INTO public.profiles (id, username, display_name)
VALUES ('2c7de16c-0fea-42fb-bf20-51ae72cc546a', 'yt', 'yt')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_settings (user_id)
VALUES ('2c7de16c-0fea-42fb-bf20-51ae72cc546a')
ON CONFLICT (user_id) DO NOTHING;