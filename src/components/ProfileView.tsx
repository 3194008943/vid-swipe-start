import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Share2, Grid3x3, Heart, Bookmark } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { mockUsers, mockVideos } from "@/data/mockData";

export const ProfileView: React.FC = () => {
  const currentUser = mockUsers[0]; // Mock current user
  const userVideos = mockVideos.filter((v) => v.user.id === currentUser.id);

  return (
    <div className="h-screen bg-background overflow-y-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">@{currentUser.username}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
          </Avatar>
          <h2 className="mt-2 text-lg font-semibold">
            {currentUser.displayName}
            {currentUser.verified && (
              <span className="ml-1 text-accent">✓</span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            @{currentUser.username}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center">
            <p className="font-bold text-lg">
              {formatNumber(currentUser.following)}
            </p>
            <p className="text-sm text-muted-foreground">Following</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">
              {formatNumber(currentUser.followers)}
            </p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
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

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="gradient" className="flex-1">
            Edit Profile
          </Button>
          <Button variant="outline" className="flex-1">
            Share Profile
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