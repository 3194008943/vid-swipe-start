-- Phase 1: Create proper user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Phase 2: Secure live stream credentials
CREATE TABLE public.stream_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id uuid REFERENCES public.live_streams(id) ON DELETE CASCADE NOT NULL UNIQUE,
    stream_key text NOT NULL,
    stream_url text,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stream_credentials
ALTER TABLE public.stream_credentials ENABLE ROW LEVEL SECURITY;

-- Only stream owners can view their credentials
CREATE POLICY "Stream owners can view their credentials"
ON public.stream_credentials
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.live_streams
        WHERE live_streams.id = stream_credentials.stream_id
        AND live_streams.user_id = auth.uid()
    )
);

-- Only stream owners can manage their credentials
CREATE POLICY "Stream owners can manage their credentials"
ON public.stream_credentials
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.live_streams
        WHERE live_streams.id = stream_credentials.stream_id
        AND live_streams.user_id = auth.uid()
    )
);

-- Migrate existing stream keys to new table (if any exist)
INSERT INTO public.stream_credentials (stream_id, stream_key, stream_url)
SELECT id, stream_key, stream_url
FROM public.live_streams
WHERE stream_key IS NOT NULL;

-- Remove sensitive columns from live_streams table
ALTER TABLE public.live_streams 
DROP COLUMN IF EXISTS stream_key,
DROP COLUMN IF EXISTS stream_url;

-- Phase 3: Fix follows table to respect privacy
-- Revoke public access and create proper policies
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;

-- Only authenticated users can view follows
CREATE POLICY "Users can view their own follows"
ON public.follows
FOR SELECT
USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id
);

-- Phase 4: Update gift management policies to use new role system
DROP POLICY IF EXISTS "Admins can manage gifts" ON public.gifts;

CREATE POLICY "Admins can manage gifts"
ON public.gifts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update the is_admin function to use the new roles table
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stream_credentials_updated_at
BEFORE UPDATE ON public.stream_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();