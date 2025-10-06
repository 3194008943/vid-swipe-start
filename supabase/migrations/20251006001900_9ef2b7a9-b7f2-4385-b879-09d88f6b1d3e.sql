-- Create chat messages table for live streams
CREATE TABLE IF NOT EXISTS public.stream_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES public.live_streams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.stream_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat
CREATE POLICY "Anyone can view stream chat"
ON public.stream_chat_messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON public.stream_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create stream viewers tracking table
CREATE TABLE IF NOT EXISTS public.stream_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES public.live_streams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  left_at timestamp with time zone,
  UNIQUE(stream_id, user_id)
);

-- Enable RLS
ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;

-- Create policies for viewers
CREATE POLICY "Anyone can view stream viewers"
ON public.stream_viewers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join streams"
ON public.stream_viewers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their viewer status"
ON public.stream_viewers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update viewer count
CREATE OR REPLACE FUNCTION public.update_stream_viewer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.live_streams
    SET viewer_count = viewer_count + 1
    WHERE id = NEW.stream_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
    UPDATE public.live_streams
    SET viewer_count = GREATEST(0, viewer_count - 1)
    WHERE id = NEW.stream_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to update viewer count
DROP TRIGGER IF EXISTS update_viewer_count_trigger ON public.stream_viewers;
CREATE TRIGGER update_viewer_count_trigger
AFTER INSERT OR UPDATE ON public.stream_viewers
FOR EACH ROW
EXECUTE FUNCTION public.update_stream_viewer_count();

-- Enable realtime for chat and viewers
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transactions;