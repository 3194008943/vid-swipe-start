import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Bell, Shield, Palette, Globe, Video, 
  Smartphone, CreditCard, HelpCircle, Info, 
  ChevronLeft, Moon, Sun, Monitor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  language: string;
  autoplay_videos: boolean;
  data_saver_mode: boolean;
  notification_videos: boolean;
  notification_live: boolean;
  notification_pvp: boolean;
  notification_gifts: boolean;
  privacy_profile: 'public' | 'friends' | 'private';
  privacy_comments: 'everyone' | 'friends' | 'none';
  privacy_gifts: 'everyone' | 'friends' | 'none';
  two_factor_enabled: boolean;
}

export const EnhancedSettingsView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    font_size: 'medium',
    language: 'en',
    autoplay_videos: true,
    data_saver_mode: false,
    notification_videos: true,
    notification_live: true,
    notification_pvp: true,
    notification_gifts: true,
    privacy_profile: 'public',
    privacy_comments: 'everyone',
    privacy_gifts: 'everyone',
    two_factor_enabled: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSettings({
        theme: data.theme as 'light' | 'dark' | 'system',
        font_size: data.font_size as 'small' | 'medium' | 'large',
        language: data.language,
        autoplay_videos: data.autoplay_videos,
        data_saver_mode: data.data_saver_mode,
        notification_videos: data.notification_videos,
        notification_live: data.notification_live,
        notification_pvp: data.notification_pvp,
        notification_gifts: data.notification_gifts,
        privacy_profile: data.privacy_profile as 'public' | 'friends' | 'private',
        privacy_comments: data.privacy_comments as 'everyone' | 'friends' | 'none',
        privacy_gifts: data.privacy_gifts as 'everyone' | 'friends' | 'none',
        two_factor_enabled: data.two_factor_enabled
      });
      applyTheme(data.theme as 'light' | 'dark' | 'system');
      applyFontSize(data.font_size as 'small' | 'medium' | 'large');
    }
  };

  const updateSettings = async (key: keyof UserSettings, value: any) => {
    if (!user) {
      toast.error("Please login to update settings");
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Apply theme or font size immediately
    if (key === 'theme') applyTheme(value);
    if (key === 'font_size') applyFontSize(value);

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        [key]: value,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } else {
      toast.success("Settings updated");
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    const root = document.documentElement;
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.fontSize = sizeMap[size];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                
                <div>
                  <Label>Password</Label>
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Switch
                    checked={settings.two_factor_enabled}
                    onCheckedChange={(checked) => updateSettings('two_factor_enabled', checked)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-destructive/50">
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                These actions are permanent and cannot be undone
              </p>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Display
              </h2>
              
              <div className="space-y-6">
                <div>
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant={settings.theme === 'light' ? 'default' : 'outline'}
                      onClick={() => updateSettings('theme', 'light')}
                      className="w-full"
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={settings.theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => updateSettings('theme', 'dark')}
                      className="w-full"
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={settings.theme === 'system' ? 'default' : 'outline'}
                      onClick={() => updateSettings('theme', 'system')}
                      className="w-full"
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Font Size</Label>
                  <Select 
                    value={settings.font_size}
                    onValueChange={(value) => updateSettings('font_size', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Language</Label>
                  <Select 
                    value={settings.language}
                    onValueChange={(value) => updateSettings('language', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Playback
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autoplay Videos</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically play videos as you scroll
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoplay_videos}
                    onCheckedChange={(checked) => updateSettings('autoplay_videos', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Saver Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce video quality to save data
                    </p>
                  </div>
                  <Switch
                    checked={settings.data_saver_mode}
                    onCheckedChange={(checked) => updateSettings('data_saver_mode', checked)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Push Notifications
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Videos</Label>
                    <p className="text-sm text-muted-foreground">
                      When users you follow upload videos
                    </p>
                  </div>
                  <Switch
                    checked={settings.notification_videos}
                    onCheckedChange={(checked) => updateSettings('notification_videos', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Live Streams</Label>
                    <p className="text-sm text-muted-foreground">
                      When users you follow go live
                    </p>
                  </div>
                  <Switch
                    checked={settings.notification_live}
                    onCheckedChange={(checked) => updateSettings('notification_live', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>PvP Battles</Label>
                    <p className="text-sm text-muted-foreground">
                      Battle challenges and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notification_pvp}
                    onCheckedChange={(checked) => updateSettings('notification_pvp', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Gifts</Label>
                    <p className="text-sm text-muted-foreground">
                      When you receive gifts
                    </p>
                  </div>
                  <Switch
                    checked={settings.notification_gifts}
                    onCheckedChange={(checked) => updateSettings('notification_gifts', checked)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select 
                    value={settings.privacy_profile}
                    onValueChange={(value: any) => updateSettings('privacy_profile', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Who Can Comment</Label>
                  <Select 
                    value={settings.privacy_comments}
                    onValueChange={(value: any) => updateSettings('privacy_comments', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="none">No One</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Who Can Send Gifts</Label>
                  <Select 
                    value={settings.privacy_gifts}
                    onValueChange={(value: any) => updateSettings('privacy_gifts', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="none">No One</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                About LetTalk
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Version</Label>
                  <p className="text-sm text-muted-foreground">1.0.0</p>
                </div>
                
                <Separator />
                
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & FAQ
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  Terms of Service
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  Privacy Policy
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  Contact Support
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};