import React, { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Share2, Grid3x3, Heart, Bookmark, Gift, ShoppingBag, Crown, QrCode, TrendingUp, Sparkles, Edit, UserPlus, Trash2, Hash, Plus } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { EditProfileModal } from "@/components/EditProfileModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadVideos();
      loadFollowStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const loadVideos = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("videos")
      .select(`
        *,
        likes(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setVideos(data);
    }
  };

  const loadFollowStats = async () => {
    if (!user) return;
    
    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: 'exact', head: true })
      .eq("following_id", user.id);

    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: 'exact', head: true })
      .eq("follower_id", user.id);

    setFollowers(followersCount || 0);
    setFollowing(followingCount || 0);
  };

  const handleSettingsClick = () => {
    setActiveTab("settings");
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
  };

  const handleDeleteVideo = async (videoId: string) => {
    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", videoId);

    if (!error) {
      toast({
        title: "Video deleted",
        description: "Your video has been removed successfully.",
      });
      loadVideos();
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${profile?.display_name || profile?.username}'s profile`,
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copied!",
        description: "Profile link has been copied to clipboard.",
      });
    }
  };

  const coolFeatures = [
    {
      icon: <Crown className="h-4 w-4" />,
      label: "Creator Fund",
      action: () => toast({ title: "Creator Fund", description: "Earn money from your content!" }),
      color: "bg-yellow-500/10 text-yellow-500"
    },
    {
      icon: <Gift className="h-4 w-4" />,
      label: "Virtual Gifts",
      action: () => toast({ title: "Virtual Gifts", description: "Send gifts to your favorite creators!" }),
      color: "bg-pink-500/10 text-pink-500"
    },
    {
      icon: <ShoppingBag className="h-4 w-4" />,
      label: "Shop",
      action: () => navigate("/shop"),
      color: "bg-purple-500/10 text-purple-500"
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Analytics",
      action: () => navigate("/analytics"),
      color: "bg-green-500/10 text-green-500"
    },
  ];

  if (!profile) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen bg-background overflow-y-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">@{profile.username}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex flex-col items-center relative">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-primary ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          </div>
          <h2 className="mt-4 text-lg font-semibold flex items-center gap-2">
            {profile.display_name || profile.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            @{profile.username}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center cursor-pointer hover:scale-105 transition-transform">
            <p className="font-bold text-lg">
              {formatNumber(following)}
            </p>
            <p className="text-sm text-muted-foreground">Following</p>
          </div>
          <div className="text-center cursor-pointer hover:scale-105 transition-transform">
            <p className="font-bold text-lg">
              {formatNumber(followers)}
            </p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div className="text-center cursor-pointer hover:scale-105 transition-transform">
            <p className="font-bold text-lg">
              {formatNumber(videos.length)}
            </p>
            <p className="text-sm text-muted-foreground">Videos</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-center mt-4 px-4">{profile.bio}</p>
        )}

        {/* Cool Features Grid */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {coolFeatures.map((feature, index) => (
            <button
              key={index}
              onClick={feature.action}
              className={`${feature.color} p-3 rounded-xl flex flex-col items-center gap-1 hover:scale-105 transition-all duration-300`}
            >
              {feature.icon}
              <span className="text-xs font-medium">{feature.label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="gradient" 
            className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="outline" className="flex-1 group" onClick={handleShare}>
            <QrCode className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            Share
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="w-full bg-transparent border-b border-border rounded-none h-12">
          <TabsTrigger
            value="videos"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Grid3x3 className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger
            value="liked"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Heart className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <Bookmark className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger
            value="shop"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            <ShoppingBag className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          {videos.length > 0 ? (
            <div className="grid grid-cols-3 gap-[1px] bg-border">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="aspect-[9/16] bg-black relative group cursor-pointer"
                >
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVideo(video.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-xs flex items-center gap-1">
                      <Heart className="h-3 w-3 fill-white" />
                      {formatNumber(video.likes?.[0]?.count || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Plus className="h-8 w-8 mb-2" />
              <p>No videos yet</p>
              <p className="text-sm">Upload your first video!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-0">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p>No liked videos yet</p>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p>No saved videos yet</p>
          </div>
        </TabsContent>

        <TabsContent value="shop" className="mt-0">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 mb-2" />
            <p>No products yet</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Products
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={() => {
          loadProfile();
          toast({
            title: "Profile updated",
            description: "Your changes have been saved.",
          });
        }}
      />
    </div>
  );
};