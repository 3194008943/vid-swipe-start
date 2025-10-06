import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Gift, Users, Video, VideoOff, Mic, MicOff, Send, X, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";
import { LiveChatBox } from "./LiveChatBox";

interface GiftOption {
  id: string;
  name: string;
  price: number;
  icon_url: string;
}

interface LiveStream {
  id: string;
  user_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_live: boolean;
  is_pvp: boolean;
  viewer_count: number;
  gift_total: number;
  started_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const LiveStreamView: React.FC = () => {
  const { user } = useAuth();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [gifts, setGifts] = useState<GiftOption[]>([]);
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    fetchLiveStreams();
    fetchGifts();
    fetchUserCoins();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('live_streams_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
          filter: 'is_live=eq.true'
        },
        () => {
          fetchLiveStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGifts = async () => {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (data) {
      setGifts(data);
    }
  };

  const fetchUserCoins = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserCoins(Number(data.balance));
    }
  };

  const fetchLiveStreams = async () => {
    const { data: streams, error: streamsError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('is_live', true)
      .order('viewer_count', { ascending: false });

    if (streamsError) {
      console.error('Error fetching streams:', streamsError);
      return;
    }

    if (!streams) {
      setLiveStreams([]);
      return;
    }

    // Fetch profiles for each stream
    const streamsWithProfiles = await Promise.all(
      streams.map(async (stream) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', stream.user_id)
          .single();

        return {
          ...stream,
          profiles: profile || { username: 'Unknown', display_name: 'Unknown', avatar_url: '' }
        } as LiveStream;
      })
    );

    setLiveStreams(streamsWithProfiles);
  };

  const startStream = async () => {
    if (!user || !streamTitle) {
      toast.error("Please enter a stream title");
      return;
    }

    // Start the stream
    const { data: streamData, error: streamError } = await supabase
      .from('live_streams')
      .insert({
        user_id: user.id,
        title: streamTitle,
        description: streamDescription,
        is_live: true,
        viewer_count: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (streamError) {
      toast.error("Failed to start stream");
      console.error(streamError);
      return;
    }

    // Create secure stream credentials (only visible to stream owner)
    const streamKey = `stream_${user.id}_${Date.now()}`;
    const streamUrl = `rtmp://stream.example.com/live/${streamKey}`;
    
    const { error: credError } = await supabase
      .from('stream_credentials')
      .insert({
        stream_id: streamData.id,
        stream_key: streamKey,
        stream_url: streamUrl
      });

    if (credError) {
      console.error("Failed to create stream credentials:", credError);
    }

    // Track streamer as first viewer
    await supabase
      .from('stream_viewers')
      .insert({
        stream_id: streamData.id,
        user_id: user.id
      });

    setIsStreaming(true);
    setSelectedStream(streamData);
    toast.success("🔴 You're now live!");
  };

  const endStream = async () => {
    if (!selectedStream) return;

    const { error } = await supabase
      .from('live_streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', selectedStream.id);

    if (error) {
      toast.error("Failed to end stream");
      return;
    }

    setIsStreaming(false);
    setSelectedStream(null);
    setStreamTitle("");
    setStreamDescription("");
    toast.success("Stream ended");
  };

  const sendGift = async (gift: GiftOption) => {
    if (!user || !selectedStream) return;

    if (userCoins < gift.price) {
      toast.error("Insufficient coins! Get more coins to send gifts.");
      return;
    }

    // Deduct coins from sender
    const { error: coinsError } = await supabase
      .from('user_coins')
      .update({ 
        balance: userCoins - gift.price,
        total_spent: userCoins - gift.price
      })
      .eq('user_id', user.id);

    if (coinsError) {
      toast.error("Failed to send gift");
      return;
    }

    // Add gift transaction
    const { error: giftError } = await supabase
      .from('gift_transactions')
      .insert({
        sender_id: user.id,
        recipient_id: selectedStream.user_id,
        gift_id: gift.id,
        amount: 1,
        total_price: gift.price,
        stream_id: selectedStream.id
      });

    if (giftError) {
      toast.error("Failed to record gift");
      return;
    }

    // Update stream gift total
    const { error: streamError } = await supabase
      .from('live_streams')
      .update({
        gift_total: (selectedStream.gift_total || 0) + gift.price
      })
      .eq('id', selectedStream.id);

    toast.success(`Sent ${gift.icon_url} ${gift.name}! 🎁`);
    setIsGiftDialogOpen(false);
    fetchUserCoins();
    fetchLiveStreams();
  };

  // Track when user joins/leaves stream
  useEffect(() => {
    if (!selectedStream || !user || selectedStream.user_id === user.id) return;

    const joinStream = async () => {
      await supabase
        .from('stream_viewers')
        .upsert({
          stream_id: selectedStream.id,
          user_id: user.id,
          left_at: null
        }, {
          onConflict: 'stream_id,user_id'
        });
    };

    const leaveStream = async () => {
      await supabase
        .from('stream_viewers')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', selectedStream.id)
        .eq('user_id', user.id);
    };

    joinStream();

    return () => {
      leaveStream();
    };
  }, [selectedStream, user]);

  if (selectedStream || isStreaming) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Stream View */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="relative aspect-video bg-black overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Video className="w-16 h-16 text-white/50 mx-auto" />
                  <p className="text-white/70 text-sm">
                    {isStreaming ? "Broadcasting..." : "Connecting to stream..."}
                  </p>
                </div>
              </div>
              
              {/* Live Badge */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500 text-white animate-pulse">
                  🔴 LIVE
                </Badge>
              </div>

              {/* Stream Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={videoEnabled ? "secondary" : "destructive"}
                    onClick={() => setVideoEnabled(!videoEnabled)}
                  >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={audioEnabled ? "secondary" : "destructive"}
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                </div>
                
                {isStreaming && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={endStream}
                  >
                    End Stream
                  </Button>
                )}
              </div>

              {/* Viewer Count */}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  <Users className="w-3 h-3 mr-1" />
                  {formatNumber(selectedStream?.viewer_count || 0)}
                </Badge>
              </div>
            </Card>

            {/* Stream Info */}
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedStream?.profiles?.avatar_url} />
                  <AvatarFallback>
                    {selectedStream?.profiles?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedStream?.title || streamTitle}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedStream?.profiles?.display_name || selectedStream?.profiles?.username}
                  </p>
                  {selectedStream?.description && (
                    <p className="text-muted-foreground mt-2">
                      {selectedStream.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success("Liked! ❤️")}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Like
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsGiftDialogOpen(true)}
                  disabled={selectedStream?.user_id === user?.id}
                >
                  <Gift className="w-4 h-4 mr-1" />
                  Send Gift
                </Button>
                <Badge variant="secondary">
                  <Coins className="w-3 h-3 mr-1" />
                  {formatNumber(userCoins)} Coins
                </Badge>
                
                <div className="ml-auto text-sm text-muted-foreground">
                  Total Gifts: {formatNumber(selectedStream?.gift_total || 0)} coins
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Section */}
          <Card className="h-[600px] lg:h-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Send className="w-4 h-4" />
                Live Chat
              </h3>
            </div>
            <div className="h-[calc(600px-60px)] lg:h-[calc(100vh-280px)]">
              <LiveChatBox streamId={selectedStream?.id || ""} />
            </div>
          </Card>
        </div>

        {/* Gift Dialog */}
        <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Send a Gift</span>
                <Badge variant="secondary" className="text-lg">
                  <Coins className="w-4 h-4 mr-1" />
                  {formatNumber(userCoins)} Coins
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4">
                {gifts.map((gift) => (
                  <Button
                    key={gift.id}
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => sendGift(gift)}
                    disabled={userCoins < gift.price}
                  >
                    <span className="text-4xl">{gift.icon_url}</span>
                    <span className="text-sm font-semibold">{gift.name}</span>
                    <div className="flex items-center gap-1 text-xs">
                      <Coins className="w-3 h-3 text-yellow-500" />
                      {formatNumber(gift.price)}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Start Stream Section */}
        {user && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Go Live</h2>
            <div className="space-y-4">
              <Input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Stream title..."
              />
              <Textarea
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                placeholder="What's your stream about?"
                rows={3}
              />
              <Button onClick={startStream} className="w-full sm:w-auto">
                <Video className="w-4 h-4 mr-2" />
                Start Streaming
              </Button>
            </div>
          </Card>
        )}

        {/* Live Streams Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Live Now</h2>
          {liveStreams.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No live streams at the moment</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map((stream) => (
                <Card
                  key={stream.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedStream(stream)}
                >
                  <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 relative">
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                      LIVE
                    </Badge>
                    <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                      <Users className="w-3 h-3 mr-1" />
                      {formatNumber(stream.viewer_count)}
                    </Badge>
                    {stream.is_pvp && (
                      <Badge className="absolute bottom-2 left-2 bg-yellow-500 text-black">
                        PVP
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-1">{stream.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={stream.profiles?.avatar_url} />
                        <AvatarFallback>
                          {stream.profiles?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {stream.profiles?.display_name || stream.profiles?.username}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};