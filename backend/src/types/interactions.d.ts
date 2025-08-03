export type LikeModel = {
  postId: string;
  likedBy: string;  
  likedAt: Date;
}

export type CommentModel = {
  postId: string;
  commentedBy: string;
  content: string;
  commentedAt: Date;
}

export type FollowModel = {
  followedBy: string;
  followedAt: Date;
  followedUserId: string;
}
