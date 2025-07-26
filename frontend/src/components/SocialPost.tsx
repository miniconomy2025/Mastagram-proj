import { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

interface Post {
  id: string;
  user_id: string;
  username: string;
  caption: string;
  hashtags: string[];
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface SocialPostProps {
  post: Post;
}

export const SocialPost = ({ post }: SocialPostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
            {post.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-heading font-semibold text-foreground">@{post.username}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-foreground leading-relaxed">{post.caption}</p>
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.hashtags.map((tag, index) => (
                <span key={index} className="text-primary text-sm font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media */}
      <div className="relative">
        <img
          src={post.media_url}
          alt="Post content"
          className="w-full h-auto max-h-96 object-cover"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-300 ${
                isLiked 
                  ? 'text-heart animate-heart-beat' 
                  : 'text-muted-foreground hover:text-heart'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium">{post.comments_count}</span>
            </button>
          </div>
          
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Share className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};