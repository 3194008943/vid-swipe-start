import React, { useState } from "react";
import { Search, TrendingUp, Music, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockVideos } from "@/data/mockData";
import { formatNumber } from "@/lib/utils";

const trendingHashtags = [
  { name: "dance", posts: "12.5M" },
  { name: "viral", posts: "8.3M" },
  { name: "comedy", posts: "6.7M" },
  { name: "fitness", posts: "4.2M" },
  { name: "cooking", posts: "3.8M" },
  { name: "tech", posts: "2.9M" },
];

const trendingSounds = [
  { name: "Flowers - Miley Cyrus", uses: "2.3M" },
  { name: "Unholy - Sam Smith", uses: "1.8M" },
  { name: "As It Was - Harry Styles", uses: "1.5M" },
];

export const DiscoverView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-screen bg-background overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border p-4">
        <h1 className="text-2xl font-bold mb-4 gradient-text">Discover</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search users, videos, sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Hashtags</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {trendingHashtags.map((tag) => (
            <Button
              key={tag.name}
              variant="glass"
              className="justify-between p-4 h-auto"
            >
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="font-medium">{tag.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {tag.posts}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Trending Sounds */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Music className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Trending Sounds</h2>
        </div>
        <div className="space-y-3">
          {trendingSounds.map((sound, index) => (
            <div
              key={sound.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{sound.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sound.uses} videos
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Videos Grid */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Featured Videos</h2>
        <div className="grid grid-cols-2 gap-2">
          {mockVideos.slice(0, 4).map((video) => (
            <div
              key={video.id}
              className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative group cursor-pointer"
            >
              <img
                src={video.thumbnail}
                alt={video.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-medium line-clamp-2">
                  {video.caption}
                </p>
                <p className="text-white/80 text-xs mt-1">
                  @{video.user.username}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-white/80 text-xs">
                    {formatNumber(video.views)} views
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};