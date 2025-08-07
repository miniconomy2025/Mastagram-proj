import { useState, useEffect } from 'react';
import {
  Heart, MessageCircle, Share, MoreHorizontal,
  Bookmark, UserPlus, UserMinus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocialActions } from '@/hooks/use-social-actions';
import './SocialPost.css';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { FederatedPost } from '@/types/federation';

interface SocialPostProps {
  post: FederatedPost;
}

export const SocialPost = ({ post }: SocialPostProps) => {
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

  const {
    followUser, unfollowUser, savePost, unsavePost,
    isFollowing, isSaved,
    likePost, unlikePost, isLiked
  } = useSocialActions();

  const [isPostSaved, setIsPostSaved] = useState(isSaved(post.id));
  const [userFollowing, setUserFollowing] = useState(isFollowing(post.author.id));
  
  const [isPostLiked, setIsPostLiked] = useState(isLiked(post.id));

  useEffect(() => {
    setIsPostLiked(isLiked(post.id));
  }, [isLiked, post.id]);


  const cleanHtml = DOMPurify.sanitize(post.content);
  const parsedContent = parse(cleanHtml);

  const hashtags = extractHashtags(post.content);

  const handleLike = async () => {
    if (isPostLiked) {
      await unlikePost(post.id);
      setLikesCount(prev => prev - 1);
    } else {
      await likePost(post.id);
      setLikesCount(prev => prev + 1);
    }
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
      await unfollowUser(post.author.id, post.author.handle);
      setUserFollowing(false);
    } else {
      await followUser(post.author.id, post.author.handle);
      setUserFollowing(true);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author.name}'s Post`,
          text: post.content.replace(/<[^>]*>/g, '').substring(0, 100),
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

  // Simplified media rendering for single attachment
  const renderMedia = () => {
    if (!post.attachment) return null;

    return (
      <div className="social-post-media">
        <Link to={`/post/${post.id}`}>
          {post.attachment.type === 'image' ? (
            <img
              src={post.attachment.url}
              alt={post.attachment.name || 'Post image'}
              className="social-post-image"
            />
          ) : (
            <video
              src={post.attachment.url}
              controls
              playsInline
              preload="metadata"
              className="social-post-image"
            />
          )}
        </Link>
      </div>
    );
  };

  return (
    <div className="sp-card">
      <div className="sp-header">
        <Link
          to={`/profile/${post.author.handle.replace('@', '')}`}
          key={post.author.id}
        >
          <div className="social-post-user-info">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="social-post-avatar"
              />
            ) : (
              <div className="social-post-avatar">{post.author.name.charAt(0).toUpperCase()}</div>
            )}
            <div>
              <p className="social-post-username">{post.author.name}</p>
              <p className="social-post-date">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>


        <div className="social-post-header-actions">
          <button className="social-post-more-btn">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>


      </div>

      <div className="sp-caption">
        <div className="sp-content">
          {parsedContent}
        </div>
        {hashtags.length > 0 && (
          <div className="sp-tags">
            {hashtags.map((tag, index) => (
              <span key={index}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {renderMedia()}

      <div className="sp-actions">
        <div className="sp-left-actions">
          <button onClick={handleLike} className={`sp-icon-btn ${isPostLiked ? 'liked' : ''}`}>
            <Heart className={isPostLiked ? 'filled' : ''} />
            <span>{likesCount}</span>
          </button>
          <Link to={`/post/${post.id}`} className="sp-icon-btn">
            <MessageCircle />
            <span>{post.repliesCount || 0}</span>
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

export function extractHashtags(content: string): string[] {
  const htmlTags = Array.from(content.matchAll(/<a[^>]*class="mention hashtag"[^>]*>#<span>([^<]*)<\/span><\/a>/g))
    .map(match => match[1]);


  if (htmlTags.length > 0) {
    return htmlTags;
  }

  const textContent = content.replace(/<[^>]*>/g, '');
  const textTags = Array.from(textContent.matchAll(/#(\w+)/g))
    .map(match => match[1]);

  return [...new Set(textTags)];
}