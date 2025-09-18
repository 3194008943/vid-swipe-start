import React, { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Share2, Grid3x3, Heart, Bookmark, Gift, ShoppingBag, Crown, QrCode, TrendingUp, Sparkles } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { mockUsers, mockVideos } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const ProfileView: React.FC = () => {
  const currentUser = mockUsers[0]; // Mock current user
  const userVideos = mockVideos.filter((v) => v.user.id === currentUser.id);
  const [activeTab, setActiveTab] = useState("home");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    setActiveTab("settings");
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
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
      action: () => toast({ title: "Shop", description: "Browse trending products!" }),
      color: "bg-purple-500/10 text-purple-500"
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Analytics",
      action: () => toast({ title: "Analytics", description: "View your performance stats!" }),
      color: "bg-green-500/10 text-green-500"
    },
  ];

  return (
    <div className="h-screen bg-background overflow-y-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">@{currentUser.username}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => toast({ title: "Sharing profile...", description: "Link copied!" })}>
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
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          </div>
          <h2 className="mt-4 text-lg font-semibold flex items-center gap-2">
            {currentUser.displayName}
            {currentUser.verified && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                <span className="text-xs">✓ Verified</span>
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            @{currentUser.username}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center cursor-pointer hover:scale-105 transition-transform">
            <p className="font-bold text-lg">
              {formatNumber(currentUser.following)}
            </p>
            <p className="text-sm text-muted-foreground">Following</p>
          </div>
          <div className="text-center cursor-pointer hover:scale-105 transition-transform">
            <p className="font-bold text-lg">
              {formatNumber(currentUser.followers)}
            </p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div className="text-center cursor-pointer hover:scale-105 transition-transform">
            <p className="font-bold text-lg">
              {formatNumber(currentUser.likes)}
            </p>
            <p className="text-sm text-muted-foreground">Likes</p>
          </div>
        </div>

        {/* Bio */}
        {currentUser.bio && (
          <p className="text-sm text-center mt-4 px-4">{currentUser.bio}</p>
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
          <Button variant="gradient" className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300">
            Edit Profile
          </Button>
          <Button variant="outline" className="flex-1 group">
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
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          <div className="grid grid-cols-3 gap-[1px] bg-border">
            {userVideos.map((video) => (
              <div
                key={video.id}
                className="aspect-[9/16] bg-black relative group cursor-pointer"
              >
                <img
                  src={video.thumbnail}
                  alt={video.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-white" />
                    {formatNumber(video.likes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
      </Tabs>
    </div>
  );
};