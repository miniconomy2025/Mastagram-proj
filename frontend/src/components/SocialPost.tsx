import { useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Bookmark,
  UserPlus,
  UserMinus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSocialActions } from '@/hooks/useSocialActions';

interface Media {
  url: string;
  type: 'image' | 'video';
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  caption: string;
  hashtags: string[];
  media?: Media[];
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
  const { followUser, unfollowUser, savePost, unsavePost, isFollowing, isSaved } = useSocialActions();
  const [isPostSaved, setIsPostSaved] = useState(isSaved(post.id));
  const [userFollowing, setUserFollowing] = useState(isFollowing(post.user_id));
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleSave = async () => {
    if (isPostSaved) {
      await unsavePost(post.id);
      setIsPostSaved(false);
    } else {
      await savePost(post.id);
      setIsPostSaved(true);
    }
  };

  const handleFollow = async () => {
    if (userFollowing) {
      await unfollowUser(post.user_id, post.username);
      setUserFollowing(false);
    } else {
      await followUser(post.user_id, post.username);
      setUserFollowing(true);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!post.media) return;

    if (direction === 'left' && currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    } else if (direction === 'right' && currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.username}'s Post`,
          text: post.caption || 'Check out this post!',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback for unsupported browsers
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        alert('Failed to copy link. Please copy it manually:\n' + shareUrl);
      }
    }
  };


  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    let moved = false;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0];
      const diff = touch.clientX - startX;
      if (Math.abs(diff) > 10) {
        moved = true;
      }
    };

    const handleTouchEnd = (endEvent: TouchEvent) => {
      if (!moved) return;

      const touch = endEvent.changedTouches[0];
      const diff = touch.clientX - startX;

      if (diff > 50) {
        // Swiped right
        handleSwipe('right');
      } else if (diff < -50) {
        // Swiped left
        handleSwipe('left');
      }

      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
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
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFollow}
            className={userFollowing ? "text-primary" : "text-muted-foreground hover:text-primary"}
          >
            {userFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {userFollowing ? 'Following' : 'Follow'}
          </Button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
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

      {/* Media Gallery */}
      {post.media?.length > 0 && (
        <div className="relative w-full">
          <div
            ref={mediaContainerRef}
            className="relative w-full overflow-hidden"
            onTouchStart={handleTouchStart}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${currentMediaIndex * 100}%)`,
                // width: `${post.media.length * 100}%`
              }}
            >
              {post.media.map((item, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 relative"
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Post media ${index + 1}`}
                      className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      preload="metadata" 
                      playsInline
                      className="w-full max-h-96 object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows (for desktop) */}
          {post.media.length > 1 && (
            <>
              <button
                onClick={() => handleSwipe('right')}
                disabled={currentMediaIndex === 0}
                className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 transition-opacity ${currentMediaIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSwipe('left')}
                disabled={currentMediaIndex === post.media.length - 1}
                className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 transition-opacity ${currentMediaIndex === post.media.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Media Indicators */}
          {post.media.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {post.media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentMediaIndex
                    ? 'bg-white w-3'
                    : 'bg-white/50 hover:bg-white/70'
                    }`}
                  aria-label={`Go to media ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-300 ${isLiked
                ? 'text-heart animate-heart-beat'
                : 'text-muted-foreground hover:text-heart'
                }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </button>

            <Link to={`/post/${post.id}`}>
              <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-6 h-6" />
                <span className="font-medium">{post.comments_count}</span>
              </button>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className={`${isPostSaved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              <Bookmark className={`w-6 h-6 ${isPostSaved ? 'fill-current' : ''}`} />
            </Button>
            <button
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <Share className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};