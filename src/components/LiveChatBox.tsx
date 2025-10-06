import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, UserPlus, UserMinus, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface GiftAnimation {
  id: string;
  gift_name: string;
  sender_name: string;
}

interface LiveChatBoxProps {
  streamId: string;
}

export const LiveChatBox: React.FC<LiveChatBoxProps> = ({ streamId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new chat messages
    const chatChannel = supabase
      .channel(`stream_chat_${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_chat_messages',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMsg.user_id)
            .single();
          
          setMessages(prev => [...prev, { ...newMsg, profiles: profile }]);
          scrollToBottom();
        }
      )
      .subscribe();

    // Subscribe to gift transactions for animations
    const giftsChannel = supabase
      .channel(`stream_gifts_${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gift_transactions',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const transaction = payload.new;
          
          // Fetch sender profile and gift details
          const [senderData, giftData] = await Promise.all([
            supabase.from('profiles').select('username').eq('id', transaction.sender_id).single(),
            supabase.from('gifts').select('name').eq('id', transaction.gift_id).single()
          ]);
          
          if (senderData.data && giftData.data) {
            const animation: GiftAnimation = {
              id: transaction.id,
              gift_name: giftData.data.name,
              sender_name: senderData.data.username
            };
            
            setGiftAnimations(prev => [...prev, animation]);
            
            // Remove animation after 3 seconds
            setTimeout(() => {
              setGiftAnimations(prev => prev.filter(a => a.id !== animation.id));
            }, 3000);
          }
        }
      )
      .subscribe();

    // Subscribe to viewer join/leave events
    const viewersChannel = supabase
      .channel(`stream_viewers_${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_viewers',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();
          
          if (profile) {
            addSystemMessage(`${profile.username} joined the stream`, 'join');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stream_viewers',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          if (payload.new.left_at && !payload.old.left_at) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', payload.new.user_id)
              .single();
            
            if (profile) {
              addSystemMessage(`${profile.username} left the stream`, 'leave');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(giftsChannel);
      supabase.removeChannel(viewersChannel);
    };
  }, [streamId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('stream_chat_messages')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', msg.user_id)
            .single();
          
          return { ...msg, profiles: profile };
        })
      );
      
      setMessages(messagesWithProfiles);
      setTimeout(scrollToBottom, 100);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('stream_chat_messages')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        message: newMessage.trim()
      });

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setNewMessage("");
  };

  const addSystemMessage = (text: string, type: 'join' | 'leave') => {
    const systemMsg: ChatMessage = {
      id: `system_${Date.now()}`,
      user_id: 'system',
      message: text,
      created_at: new Date().toISOString(),
      profiles: {
        username: type === 'join' ? '👋' : '👋',
        avatar_url: ''
      }
    };
    setMessages(prev => [...prev, systemMsg]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Gift Animations Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {giftAnimations.map((gift) => (
          <div
            key={gift.id}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-scale-in"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3">
              <Gift className="w-8 h-8" />
              <div>
                <div className="font-bold text-lg">{gift.gift_name}</div>
                <div className="text-sm opacity-90">from {gift.sender_name}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2 animate-fade-in">
              <Avatar className="w-6 h-6 mt-1">
                <AvatarImage src={msg.profiles?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {msg.profiles?.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {msg.profiles?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            maxLength={500}
          />
          <Button 
            size="icon" 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
