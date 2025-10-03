import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, Users, Video, Gift, AlertTriangle, 
  TrendingUp, Settings, Ban, Check, X, 
  Search, Filter, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

interface Analytics {
  totalUsers: number;
  totalVideos: number;
  activeLiveStreams: number;
  totalGifts: number;
  reportedContent: number;
}

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalVideos: 0,
    activeLiveStreams: 0,
    totalGifts: 0,
    reportedContent: 0
  });
  const [reportedVideos, setReportedVideos] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [newGift, setNewGift] = useState({ name: '', price: '', icon_url: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
      fetchReportedContent();
      fetchLiveStreams();
      fetchGifts();
      fetchUsers();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    // Check if user has admin role using the secure role system
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const fetchAnalytics = async () => {
    // Fetch user count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch video count
    const { count: videoCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    // Fetch active live streams
    const { count: liveCount } = await supabase
      .from('live_streams')
      .select('*', { count: 'exact', head: true })
      .eq('is_live', true);

    // Fetch gift transactions
    const { data: giftData } = await supabase
      .from('gift_transactions')
      .select('total_price');

    const totalGifts = giftData?.reduce((sum, gift) => sum + Number(gift.total_price), 0) || 0;

    setAnalytics({
      totalUsers: userCount || 0,
      totalVideos: videoCount || 0,
      activeLiveStreams: liveCount || 0,
      totalGifts,
      reportedContent: 0 // This would come from a reports table
    });
  };

  const fetchReportedContent = async () => {
    // In a real app, this would fetch from a reports table
    const { data } = await supabase
      .from('videos')
      .select(`
        *,
        profiles:user_id (username, display_name)
      `)
      .limit(10);

    setReportedVideos(data || []);
  };

  const fetchLiveStreams = async () => {
    const { data } = await supabase
      .from('live_streams')
      .select(`
        *,
        profiles:user_id (username, display_name)
      `)
      .eq('is_live', true);

    setLiveStreams(data || []);
  };

  const fetchGifts = async () => {
    const { data } = await supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false });

    setGifts(data || []);
  };

  const moderateVideo = async (videoId: string, action: 'approve' | 'remove') => {
    if (action === 'remove') {
      const { error } = await supabase
        .from('videos')
        .update({ is_published: false })
        .eq('id', videoId);

      if (error) {
        toast.error("Failed to remove video");
      } else {
        toast.success("Video removed");
        fetchReportedContent();
      }
    } else {
      toast.success("Video approved");
    }
  };

  const endLiveStream = async (streamId: string) => {
    const { error } = await supabase
      .from('live_streams')
      .update({ 
        is_live: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', streamId);

    if (error) {
      toast.error("Failed to end stream");
    } else {
      toast.success("Stream ended");
      fetchLiveStreams();
    }
  };

  const addGift = async () => {
    if (!newGift.name || !newGift.price) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .from('gifts')
      .insert({
        name: newGift.name,
        price: parseFloat(newGift.price),
        icon_url: newGift.icon_url,
        is_active: true
      });

    if (error) {
      toast.error("Failed to add gift");
    } else {
      toast.success("Gift added successfully");
      setNewGift({ name: '', price: '', icon_url: '' });
      fetchGifts();
    }
  };

  const toggleGift = async (giftId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('gifts')
      .update({ is_active: !isActive })
      .eq('id', giftId);

    if (error) {
      toast.error("Failed to update gift");
    } else {
      toast.success(`Gift ${!isActive ? 'activated' : 'deactivated'}`);
      fetchGifts();
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (role),
        user_settings (privacy_profile)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    setUsers(data || []);
  };

  const toggleUserRole = async (userId: string, role: 'admin' | 'moderator') => {
    // Check if role exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (existingRole) {
      // Remove role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        toast.error("Failed to remove role");
      } else {
        toast.success(`${role} role removed`);
        fetchUsers();
      }
    } else {
      // Add role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        toast.error("Failed to add role");
      } else {
        toast.success(`${role} role granted`);
        fetchUsers();
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">
            You need admin privileges to access this panel
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage content, users, and platform settings
            </p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalUsers)}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Videos</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalVideos)}</p>
              </div>
              <Video className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live Streams</p>
                <p className="text-2xl font-bold">{analytics.activeLiveStreams}</p>
              </div>
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gift Revenue</p>
                <p className="text-2xl font-bold">${formatNumber(analytics.totalGifts)}</p>
              </div>
              <Gift className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reports</p>
                <p className="text-2xl font-bold">{analytics.reportedContent}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="moderation" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
            <TabsTrigger value="live">Live Streams</TabsTrigger>
            <TabsTrigger value="gifts">Gift Management</TabsTrigger>
            <TabsTrigger value="users">User Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Content Moderation */}
          <TabsContent value="moderation" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Reported Content</h2>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {reportedVideos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{video.caption}</h3>
                        <p className="text-sm text-muted-foreground">
                          By {video.profiles?.username} • {formatNumber(video.views)} views
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moderateVideo(video.id, 'approve')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => moderateVideo(video.id, 'remove')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {reportedVideos.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No reported content at this time
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Live Stream Management */}
          <TabsContent value="live" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Active Live Streams</h2>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {liveStreams.map((stream) => (
                    <div key={stream.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{stream.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          By {stream.profiles?.username} • {formatNumber(stream.viewer_count)} viewers
                        </p>
                        {stream.is_pvp && (
                          <Badge variant="secondary" className="mt-1">PvP Battle</Badge>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => endLiveStream(stream.id)}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        End Stream
                      </Button>
                    </div>
                  ))}
                  
                  {liveStreams.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No active live streams
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Gift Management */}
          <TabsContent value="gifts" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Gift</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Gift Name</Label>
                  <Input
                    value={newGift.name}
                    onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                    placeholder="e.g., Rose"
                  />
                </div>
                
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={newGift.price}
                    onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
                    placeholder="0.99"
                  />
                </div>
                
                <div>
                  <Label>Icon URL (optional)</Label>
                  <Input
                    value={newGift.icon_url}
                    onChange={(e) => setNewGift({ ...newGift, icon_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="flex items-end">
                  <Button onClick={addGift} className="w-full">
                    <Gift className="w-4 h-4 mr-2" />
                    Add Gift
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Existing Gifts</h2>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {gifts.map((gift) => (
                    <div key={gift.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {gift.icon_url && (
                          <img src={gift.icon_url} alt={gift.name} className="w-8 h-8" />
                        )}
                        <div>
                          <p className="font-semibold">{gift.name}</p>
                          <p className="text-sm text-muted-foreground">${gift.price}</p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant={gift.is_active ? "outline" : "default"}
                        onClick={() => toggleGift(gift.id, gift.is_active)}
                      >
                        {gift.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* User Settings */}
          <TabsContent value="users" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">User Management</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{user.display_name || user.username}</p>
                            {user.user_roles?.some((r: any) => r.role === 'admin') && (
                              <Badge variant="destructive">Admin</Badge>
                            )}
                            {user.user_roles?.some((r: any) => r.role === 'moderator') && (
                              <Badge variant="secondary">Moderator</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Privacy: {user.user_settings?.[0]?.privacy_profile || 'public'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={user.user_roles?.some((r: any) => r.role === 'moderator') ? "default" : "outline"}
                          onClick={() => toggleUserRole(user.id, 'moderator')}
                        >
                          {user.user_roles?.some((r: any) => r.role === 'moderator') ? 'Remove Mod' : 'Make Mod'}
                        </Button>
                        <Button
                          size="sm"
                          variant={user.user_roles?.some((r: any) => r.role === 'admin') ? "destructive" : "outline"}
                          onClick={() => toggleUserRole(user.id, 'admin')}
                        >
                          {user.user_roles?.some((r: any) => r.role === 'admin') ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Platform Analytics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">User Growth</h3>
                  <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart placeholder</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Revenue Trends</h3>
                  <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart placeholder</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Content Statistics</h3>
                  <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart placeholder</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Engagement Metrics</h3>
                  <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart placeholder</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};