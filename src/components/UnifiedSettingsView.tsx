import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, User, Lock, Palette, Bell, Shield, 
  Globe, Moon, Sun, Monitor, LogOut, 
  Users, Video, Gift, AlertTriangle, BarChart3,
  Ban, Check, X, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { formatNumber } from "@/lib/utils";

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  autoplay_videos: boolean;
  notification_videos: boolean;
  notification_live: boolean;
  notification_gifts: boolean;
  privacy_profile: 'public' | 'friends' | 'private';
  two_factor_enabled: boolean;
}

export const UnifiedSettingsView = ({ onBack }: { onBack: () => void }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    autoplay_videos: true,
    notification_videos: true,
    notification_live: true,
    notification_gifts: true,
    privacy_profile: 'public',
    two_factor_enabled: false
  });
  
  // Admin state
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalVideos: 0,
    activeLiveStreams: 0,
    totalGifts: 0
  });
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [newGift, setNewGift] = useState({ name: '', price: '' });

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchSettings();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setSettings({
        theme: data.theme as any,
        autoplay_videos: data.autoplay_videos,
        notification_videos: data.notification_videos,
        notification_live: data.notification_live,
        notification_gifts: data.notification_gifts,
        privacy_profile: data.privacy_profile as any,
        two_factor_enabled: data.two_factor_enabled
      });
      applyTheme(data.theme);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (key === 'theme') applyTheme(value);
    
    await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        [key]: value
      });
    
    toast({ title: "Settings updated" });
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast({ title: "Signed out successfully" });
  };

  // Admin functions
  const fetchAdminData = async () => {
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: videoCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    const { data: streams } = await supabase
      .from('live_streams')
      .select('*, profiles:user_id(username)')
      .eq('is_live', true);

    const { data: giftsData } = await supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false });

    setAnalytics({
      totalUsers: userCount || 0,
      totalVideos: videoCount || 0,
      activeLiveStreams: streams?.length || 0,
      totalGifts: giftsData?.length || 0
    });
    
    setLiveStreams(streams || []);
    setGifts(giftsData || []);
  };

  const endLiveStream = async (streamId: string) => {
    await supabase
      .from('live_streams')
      .update({ is_live: false, ended_at: new Date().toISOString() })
      .eq('id', streamId);
    
    sonnerToast.success("Stream ended");
    fetchAdminData();
  };

  const addGift = async () => {
    if (!newGift.name || !newGift.price) {
      sonnerToast.error("Please fill in all fields");
      return;
    }

    await supabase
      .from('gifts')
      .insert({
        name: newGift.name,
        price: parseFloat(newGift.price),
        is_active: true
      });

    sonnerToast.success("Gift added");
    setNewGift({ name: '', price: '' });
    fetchAdminData();
  };

  const toggleGift = async (giftId: string, isActive: boolean) => {
    await supabase
      .from('gifts')
      .update({ is_active: !isActive })
      .eq('id', giftId);

    sonnerToast.success(`Gift ${!isActive ? 'activated' : 'deactivated'}`);
    fetchAdminData();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
          <div className="w-9" />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-64px)]">
        <div className="max-w-2xl mx-auto p-4 space-y-1 pb-20">
          {/* Account Section */}
          <div className="bg-card rounded-lg border">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Account</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Extra security for your account</p>
                </div>
              </div>
              <Switch
                checked={settings.two_factor_enabled}
                onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
              />
            </div>
          </div>

          {/* Theme */}
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium">Theme</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={settings.theme === 'light' ? 'default' : 'outline'}
                onClick={() => updateSetting('theme', 'light')}
                size="sm"
              >
                <Sun className="w-4 h-4 mr-1" />
                Light
              </Button>
              <Button
                variant={settings.theme === 'dark' ? 'default' : 'outline'}
                onClick={() => updateSetting('theme', 'dark')}
                size="sm"
              >
                <Moon className="w-4 h-4 mr-1" />
                Dark
              </Button>
              <Button
                variant={settings.theme === 'system' ? 'default' : 'outline'}
                onClick={() => updateSetting('theme', 'system')}
                size="sm"
              >
                <Monitor className="w-4 h-4 mr-1" />
                Auto
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">New Videos</p>
                  <p className="text-xs text-muted-foreground">From people you follow</p>
                </div>
              </div>
              <Switch
                checked={settings.notification_videos}
                onCheckedChange={(checked) => updateSetting('notification_videos', checked)}
              />
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Live Streams</p>
                  <p className="text-xs text-muted-foreground">When someone goes live</p>
                </div>
              </div>
              <Switch
                checked={settings.notification_live}
                onCheckedChange={(checked) => updateSetting('notification_live', checked)}
              />
            </div>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Gifts</p>
                  <p className="text-xs text-muted-foreground">When you receive gifts</p>
                </div>
              </div>
              <Switch
                checked={settings.notification_gifts}
                onCheckedChange={(checked) => updateSetting('notification_gifts', checked)}
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium">Profile Visibility</p>
            </div>
            <Select 
              value={settings.privacy_profile}
              onValueChange={(value: any) => updateSetting('privacy_profile', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Playback */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Autoplay Videos</p>
                  <p className="text-xs text-muted-foreground">Play videos automatically</p>
                </div>
              </div>
              <Switch
                checked={settings.autoplay_videos}
                onCheckedChange={(checked) => updateSetting('autoplay_videos', checked)}
              />
            </div>
          </div>

          {/* Admin Panel Section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-bold text-destructive">Admin Panel</p>
                </div>
              </div>

              {/* Analytics */}
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-destructive/5 border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Users</p>
                      <p className="text-xl font-bold">{formatNumber(analytics.totalUsers)}</p>
                    </div>
                    <Users className="w-6 h-6 text-destructive" />
                  </div>
                </Card>
                <Card className="p-3 bg-destructive/5 border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Videos</p>
                      <p className="text-xl font-bold">{formatNumber(analytics.totalVideos)}</p>
                    </div>
                    <Video className="w-6 h-6 text-destructive" />
                  </div>
                </Card>
                <Card className="p-3 bg-destructive/5 border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Live</p>
                      <p className="text-xl font-bold">{analytics.activeLiveStreams}</p>
                    </div>
                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                  </div>
                </Card>
                <Card className="p-3 bg-destructive/5 border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Gifts</p>
                      <p className="text-xl font-bold">{analytics.totalGifts}</p>
                    </div>
                    <Gift className="w-6 h-6 text-destructive" />
                  </div>
                </Card>
              </div>

              {/* Live Streams Management */}
              {liveStreams.length > 0 && (
                <Card className="p-4 border-destructive/20">
                  <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Active Streams
                  </h3>
                  <div className="space-y-2">
                    {liveStreams.slice(0, 3).map((stream) => (
                      <div key={stream.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{stream.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {stream.profiles?.username} • {formatNumber(stream.viewer_count)} viewers
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => endLiveStream(stream.id)}
                        >
                          <Ban className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Gift Management */}
              <Card className="p-4 border-destructive/20">
                <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Add New Gift
                </h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Gift name"
                    value={newGift.name}
                    onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Price (coins)"
                    value={newGift.price}
                    onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
                  />
                  <Button onClick={addGift} className="w-full" variant="destructive">
                    Add Gift
                  </Button>
                </div>
              </Card>

              {/* Existing Gifts */}
              {gifts.length > 0 && (
                <Card className="p-4 border-destructive/20">
                  <h3 className="font-semibold text-destructive mb-3">Manage Gifts</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {gifts.map((gift) => (
                      <div key={gift.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{gift.name}</p>
                          <p className="text-xs text-muted-foreground">{gift.price} coins</p>
                        </div>
                        <Button
                          size="sm"
                          variant={gift.is_active ? "destructive" : "outline"}
                          onClick={() => toggleGift(gift.id, gift.is_active)}
                        >
                          {gift.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Logout */}
          <div className="pt-4">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
