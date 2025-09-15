import React, { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Video } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  onCommentClick: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isActive,
  onCommentClick,
}) => {
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [likes, setLikes] = useState(video.likes);
  const [isFollowing, setIsFollowing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.caption,
          text: `Check out this video by @${video.user.username}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  return (
    <div className="relative h-full w-full bg-black snap-center">
      {/* Video */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={video.url}
        loop
        muted
        playsInline
        poster={video.thumbnail}
      />

      {/* Video Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-end justify-between">
          {/* Left side - User info and caption */}
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={video.user.avatar} />
                <AvatarFallback>{video.user.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-white">
                  @{video.user.username}
                  {video.user.verified && (
                    <span className="ml-1 text-accent">✓</span>
                  )}
                </p>
              </div>
              {!isFollowing && (
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => setIsFollowing(true)}
                  className="ml-2 h-7 px-3 text-xs"
                >
                  Follow
                </Button>
              )}
            </div>
            <p className="text-white text-sm mb-2 line-clamp-2">
              {video.caption}
            </p>
            <div className="flex flex-wrap gap-2">
              {video.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex flex-col gap-4 items-center">
            <Button
              variant="icon"
              size="icon"
              className="h-12 w-12"
              onClick={handleLike}
            >
              <Heart
                className={`h-6 w-6 transition-all ${
                  isLiked
                    ? "text-primary fill-primary animate-heart-burst"
                    : "text-white"
                }`}
              />
            </Button>
            <span className="text-white text-xs font-semibold">
              {formatNumber(likes)}
            </span>

            <Button
              variant="icon"
              size="icon"
              className="h-12 w-12"
              onClick={onCommentClick}
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            <span className="text-white text-xs font-semibold">
              {formatNumber(video.comments)}
            </span>

            <Button
              variant="icon"
              size="icon"
              className="h-12 w-12"
              onClick={handleShare}
            >
              <Share2 className="h-6 w-6 text-white" />
            </Button>
            <span className="text-white text-xs font-semibold">
              {formatNumber(video.shares)}
            </span>

            <Button variant="icon" size="icon" className="h-12 w-12">
              <Bookmark className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};