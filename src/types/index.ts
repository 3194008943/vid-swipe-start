export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: number;
  likes: number;
  verified?: boolean;
}

export interface Video {
  id: string;
  url: string;
  thumbnail: string;
  caption: string;
  user: User;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: Date;
  hashtags: string[];
  isLiked?: boolean;
  duration?: number;
}

export interface Comment {
  id: string;
  text: string;
  user: User;
  createdAt: Date;
  likes: number;
  replies?: Comment[];
}