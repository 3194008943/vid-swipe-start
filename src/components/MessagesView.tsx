import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender?: Profile;
  recipient?: Profile;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string;
  last_message_type: string | null;
  read_at: string | null;
  profile?: Profile;
}

const MessagesView: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        loadConversations();
        loadUsers();
      }
    });

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === currentUserId || newMsg.recipient_id === currentUserId) {
            if ((selectedUser && newMsg.sender_id === selectedUser.id) || 
                (selectedUser && newMsg.recipient_id === selectedUser.id)) {
              loadMessages(selectedUser.id);
            }
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUser]);

  const loadConversations = async () => {
    if (!currentUserId) return;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    // Load profiles for conversations
    if (data && data.length > 0) {
      const userIds = data.map(conv => {
        // Get the other user ID based on current user
        return conv.participant1_id === currentUserId 
          ? conv.participant2_id 
          : conv.participant1_id;
      });
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const conversationsWithProfiles = data.map(conv => {
        const otherUserId = conv.participant1_id === currentUserId 
          ? conv.participant2_id 
          : conv.participant1_id;
        
        return {
          ...conv,
          profile: profiles?.find(p => p.id === otherUserId)
        };
      });

      setConversations(conversationsWithProfiles);
    } else {
      setConversations([]);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .order('username');

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    setUsers(data || []);
  };

  const loadMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        recipient:profiles!messages_recipient_id_fkey(*)
      `)
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    if (data && data.length > 0) {
      const unreadMessages = data.filter(
        msg => msg.recipient_id === currentUserId && !msg.read_at
      );
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId) return;

    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUserId,
        recipient_id: selectedUser.id,
        content: newMessage.trim()
      });

    if (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } else {
      setNewMessage("");
    }
    setLoading(false);
  };

  const selectConversation = (user: Profile) => {
    setSelectedUser(user);
    loadMessages(user.id);
  };

  const startNewConversation = (user: Profile) => {
    setSelectedUser(user);
    setMessages([]);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const getUserInitials = (profile: Profile) => {
    return (profile.display_name || profile.username).substring(0, 2).toUpperCase();
  };

  if (selectedUser) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="border-b p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src={selectedUser.avatar_url || undefined} />
            <AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{selectedUser.display_name || selectedUser.username}</h3>
            <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isSent = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isSent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-bold mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations and Users */}
      <ScrollArea className="flex-1">
        {searchTerm ? (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">USERS</h3>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => startNewConversation(user)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.display_name || user.username}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            {conversations.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">CONVERSATIONS</h3>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => conv.profile && selectConversation(conv.profile)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={conv.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {conv.profile ? getUserInitials(conv.profile) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">
                          {conv.profile?.display_name || conv.profile?.username || 'Unknown'}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message_type === 'sent' && 'You: '}
                        {conv.last_message}
                      </p>
                    </div>
                    {conv.last_message_type === 'received' && !conv.read_at && (
                      <div className="h-2 w-2 bg-primary rounded-full" />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Search for users to start a conversation
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MessagesView;