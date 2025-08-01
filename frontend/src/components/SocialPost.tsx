import './SocialPost.css';
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
        handleSwipe('right');
      } else if (diff < -50) {
        handleSwipe('left');
      }

      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  };

  return (
    <div className="social-post">
      {/* Header */}
      <div className="post-header">
        <div className="post-user">
          <div className="post-avatar">{post.username.charAt(0).toUpperCase()}</div>
          <div className="post-user-info">
            <p className="username">@{post.username}</p>
            <p className="date">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="post-actions-header">
          <button
            onClick={handleFollow}
            className={`follow-btn ${userFollowing ? 'following' : ''}`}
          >
            {userFollowing ? <UserMinus className="icon-sm" /> : <UserPlus className="icon-sm" />}
            {userFollowing ? 'Following' : 'Follow'}
          </button>
          <button className="icon-button">
            <MoreHorizontal className="icon-md" />
          </button>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="post-caption">
          <p>{post.caption}</p>
          {post.hashtags.length > 0 && (
            <div className="hashtags">
              {post.hashtags.map((tag, idx) => (
                <Link to={`/tags/${tag}`} key={idx} className="hashtag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {post.media?.length > 0 && (
        <div className="media-gallery" onTouchStart={handleTouchStart} ref={mediaContainerRef}>
          <div
            className="media-track"
            style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
          >
            {post.media.map((media, index) => (
              <div key={index} className="media-item">
                {media.type === 'image' ? (
                  <img src={media.url} alt={`media-${index}`} />
                ) : (
                  <video src={media.url} controls playsInline />
                )}
              </div>
            ))}
          </div>

          {post.media.length > 1 && (
            <>
              <button onClick={() => handleSwipe('right')} disabled={currentMediaIndex === 0} className="nav-button left">
                <ChevronLeft />
              </button>
              <button onClick={() => handleSwipe('left')} disabled={currentMediaIndex === post.media.length - 1} className="nav-button right">
                <ChevronRight />
              </button>
              <div className="media-dots">
                {post.media.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentMediaIndex(i)}
                    className={`dot ${i === currentMediaIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="post-footer">
        <div className="left-actions">
          <button onClick={handleLike} className={`icon-button ${isLiked ? 'liked' : ''}`}>
            <Heart className={`icon-lg ${isLiked ? 'filled' : ''}`} />
            <span>{likesCount}</span>
          </button>
          <Link to={`/post/${post.id}`} className="icon-button">
            <MessageCircle className="icon-lg" />
            <span>{post.comments_count}</span>
          </Link>
        </div>
        <div className="right-actions">
          <button onClick={handleSave} className={`icon-button ${isPostSaved ? 'saved' : ''}`}>
            <Bookmark className="icon-lg" />
          </button>
          <button onClick={handleShare} className="icon-button">
            <Share className="icon-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};
