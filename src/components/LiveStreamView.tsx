import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Gift, Users, Video, VideoOff, Mic, MicOff, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

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

  useEffect(() => {
    fetchLiveStreams();
    
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
      // Still allow stream to continue, just without credentials
    }

    setIsStreaming(true);
    setSelectedStream(streamData);
    toast.success("Stream started!");
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

  const sendGift = async (streamId: string) => {
    // This would integrate with the gifts system
    toast.success("Gift sent! 🎁");
  };

  if (selectedStream || isStreaming) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Stream View */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="relative aspect-video bg-black overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="w-16 h-16 text-white/50" />
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
              <h2 className="text-xl font-bold">{selectedStream?.title || streamTitle}</h2>
              <p className="text-muted-foreground mt-2">
                {selectedStream?.description || streamDescription}
              </p>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Liked!")}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Like
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendGift(selectedStream?.id || "")}
                  >
                    <Gift className="w-4 h-4 mr-1" />
                    Send Gift
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Gifts: ${formatNumber(selectedStream?.gift_total || 0)}
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Live Chat</h3>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {/* Chat messages would go here */}
                  <div className="text-center text-muted-foreground py-8">
                    Chat messages will appear here
                  </div>
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        toast.success("Message sent!");
                        setChatMessage("");
                      }
                    }}
                  />
                  <Button size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
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