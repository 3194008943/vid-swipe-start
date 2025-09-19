-- First, check if conversations is a view or table and handle accordingly
DO $$
BEGIN
    -- If conversations is a view, drop it to recreate as a secure table
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'conversations') THEN
        DROP VIEW IF EXISTS public.conversations;
    END IF;
END $$;

-- Create conversations as a proper table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant1_id UUID NOT NULL,
    participant2_id UUID NOT NULL,
    last_message_id UUID,
    last_message TEXT,
    last_message_type TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(participant1_id, participant2_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations they're part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they're part of" ON public.conversations;

-- Create RLS policies for conversations
-- Users can only view conversations they're participating in
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
);

-- Users can create conversations where they're a participant
CREATE POLICY "Users can create conversations they're part of" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
);

-- Users can update conversations they're participating in (for read status, etc.)
CREATE POLICY "Users can update conversations they're part of" 
ON public.conversations 
FOR UPDATE 
USING (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
);

-- Create a secure view for easier conversation queries
CREATE OR REPLACE VIEW public.conversation_view AS
SELECT 
    CASE 
        WHEN c.participant1_id = auth.uid() THEN c.participant2_id
        ELSE c.participant1_id
    END as other_user_id,
    c.id as conversation_id,
    c.last_message,
    c.last_message_type,
    c.last_message_at,
    c.last_message_id,
    c.read_at,
    c.created_at,
    c.updated_at
FROM public.conversations c
WHERE c.participant1_id = auth.uid() OR c.participant2_id = auth.uid();

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Migrate existing message data to conversations table if needed
INSERT INTO public.conversations (participant1_id, participant2_id, last_message_id, last_message, last_message_at)
SELECT DISTINCT ON (LEAST(m.sender_id, m.recipient_id), GREATEST(m.sender_id, m.recipient_id))
    LEAST(m.sender_id, m.recipient_id) as participant1_id,
    GREATEST(m.sender_id, m.recipient_id) as participant2_id,
    m.id as last_message_id,
    m.content as last_message,
    m.created_at as last_message_at
FROM public.messages m
WHERE NOT EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE (c.participant1_id = LEAST(m.sender_id, m.recipient_id) 
       AND c.participant2_id = GREATEST(m.sender_id, m.recipient_id))
)
ORDER BY LEAST(m.sender_id, m.recipient_id), GREATEST(m.sender_id, m.recipient_id), m.created_at DESC
ON CONFLICT (participant1_id, participant2_id) DO NOTHING;