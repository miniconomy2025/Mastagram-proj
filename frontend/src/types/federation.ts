export interface FederatedUser {
  id: string;
  handle: string;
  name: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  next?: string;
}


export interface FederatedPost {
  id: string;
  author: {
    id: string;
    handle: string;
    name: string;
    avatar?: string; 
  };
  content: string;
  contentMediaType: string;
  isReplyTo?: string;
  createdAt: string;
  likesCount?: number;
  repliesCount?: number;
  reblogsCount?: number;
  attachment?: MediaAttachment;
}

export interface MediaAttachment {
  type: 'image' | 'video' | 'gifv' | 'audio';
  url: string;
  name?: string;
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}