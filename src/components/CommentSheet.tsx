import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Comment {
  id: string;
  user: {
    username: string;
    avatar: string;
  };
  text: string;
  likes: number;
  timeAgo: string;
  isLiked?: boolean;
}

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

const mockComments: Comment[] = [
  {
    id: "1",
    user: {
      username: "user123",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user123",
    },
    text: "This is amazing! 🔥🔥",
    likes: 234,
    timeAgo: "2h",
    isLiked: false,
  },
  {
    id: "2",
    user: {
      username: "creative_soul",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=creative",
    },
    text: "Love the energy in this video!",
    likes: 89,
    timeAgo: "4h",
    isLiked: true,
  },
  {
    id: "3",
    user: {
      username: "vibes_only",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vibes",
    },
    text: "Tutorial please! This is so cool",
    likes: 156,
    timeAgo: "5h",
    isLiked: false,
  },
];

export const CommentSheet: React.FC<CommentSheetProps> = ({
  isOpen,
  onClose,
  videoId,
}) => {
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState("");

  const handleLikeComment = (commentId: string) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );
  };

  const handleSendComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        user: {
          username: "current_user",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
        },
        text: newComment,
        likes: 0,
        timeAgo: "now",
        isLiked: false,
      };
      setComments([comment, ...comments]);
      setNewComment("");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-2xl bg-background border-t border-border"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-center">
            {comments.length} Comments
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 max-h-[calc(70vh-140px)]">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {comment.user.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {comment.timeAgo}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.text}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col gap-0 h-auto p-1"
                onClick={() => handleLikeComment(comment.id)}
              >
                <Heart
                  className={`h-4 w-4 ${
                    comment.isLiked ? "fill-primary text-primary" : ""
                  }`}
                />
                <span className="text-xs">{formatNumber(comment.likes)}</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
              className="flex-1"
            />
            <Button
              variant="gradient"
              size="icon"
              onClick={handleSendComment}
              disabled={!newComment.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};