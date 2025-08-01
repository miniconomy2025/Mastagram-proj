import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Share, MoreHorizontal,
  Bookmark, UserPlus, UserMinus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocialActions } from '@/hooks/useSocialActions';
import './SocialPost.css';

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

      if (diff > 50) handleSwipe('right');
      else if (diff < -50) handleSwipe('left');

      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  };

  return (
    <div className="sp-card">
      <div className="sp-header">
        <div className="sp-user-info">
          <div className="sp-avatar">{post.username.charAt(0).toUpperCase()}</div>
          <div>
            <p className="sp-username">@{post.username}</p>
            <p className="sp-date">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="sp-controls">
          <button onClick={handleFollow} className={`sp-follow-btn ${userFollowing ? 'active' : ''}`}>
            {userFollowing ? <UserMinus /> : <UserPlus />}
            {userFollowing ? 'Following' : 'Follow'}
          </button>
          <button className="sp-icon-btn"><MoreHorizontal /></button>
        </div>
      </div>

      {post.caption && (
        <div className="sp-caption">
          <p>{post.caption}</p>
          {post.hashtags.length > 0 && (
            <div className="sp-tags">
              {post.hashtags.map((tag, index) => (
                <span key={index}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {post.media?.length > 0 && (
        <div className="sp-media-wrapper">
          <div
            className="sp-media-slider"
            ref={mediaContainerRef}
            onTouchStart={handleTouchStart}
            style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
          >
            {post.media.map((item, index) => (
              <div key={index} className="sp-media-item">
                {item.type === 'image' ? (
                  <img src={item.url} alt={`media-${index}`} />
                ) : (
                  <video src={item.url} controls playsInline preload="metadata" />
                )}
              </div>
            ))}
          </div>

          {post.media.length > 1 && (
            <>
              <button
                className={`sp-arrow left ${currentMediaIndex === 0 ? 'disabled' : ''}`}
                onClick={() => handleSwipe('right')}
              >
                <ChevronLeft />
              </button>
              <button
                className={`sp-arrow right ${currentMediaIndex === post.media.length - 1 ? 'disabled' : ''}`}
                onClick={() => handleSwipe('left')}
              >
                <ChevronRight />
              </button>
              <div className="sp-dots">
                {post.media.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentMediaIndex(i)}
                    className={i === currentMediaIndex ? 'active' : ''}
                    aria-label={`Go to media ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="sp-actions">
        <div className="sp-left-actions">
          <button onClick={handleLike} className={`sp-icon-btn ${isLiked ? 'liked' : ''}`}>
            <Heart className={isLiked ? 'filled' : ''} />
            <span>{likesCount}</span>
          </button>
          <Link to={`/post/${post.id}`} className="sp-icon-btn">
            <MessageCircle />
            <span>{post.comments_count}</span>
          </Link>
        </div>
        <div className="sp-right-actions">
          <button onClick={handleSave} className={`sp-icon-btn ${isPostSaved ? 'saved' : ''}`}>
            <Bookmark className={isPostSaved ? 'filled' : ''} />
          </button>
          <button onClick={handleShare} className="sp-icon-btn"><Share /></button>
        </div>
      </div>
    </div>
  );
};
