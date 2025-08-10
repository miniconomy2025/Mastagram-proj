import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { CommentSection } from '@/components/CommentSection';
import './PostDetail.css';
import { api } from '@/lib/api';

interface Author {
  id: string;
  handle: string;
  name: string;
  avatar?: string;
}

interface ApiPost {
  id: string;
  author: Author;
  content: string;
  contentMediaType?: string;
  attachment?: {
    type: 'image' | 'video';
    url: string;
    name?: string;
  };
  likesCount?: number;
  repliesCount?: number;
  isReplyTo?: string;
  createdAt: string;
  likedByMe?: boolean;
}

interface ApiResponse {
  post: ApiPost;
  replies: {
    items: ApiPost[];
    next?: string;
    count: number;
  };
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar?: string;
  caption: string;
  hashtags: string[];
  media_url?: string;
  media_type?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar?: string;
  content: string;
  likes_count: number;
  created_at: string;
  replies?: Comment[];
}

const extractUsernameFromHandle = (handle: string) => {
  return handle.split('@')[1] || 'user';
};

const extractHashtags = (content: string) => {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.map(tag => tag.replace('#', '')) : [];
};

const cleanHtmlContent = (html: string) => {
  // Simple HTML to plain text conversion
  return html.replace(/<[^>]*>/g, ' ');
};

const mapApiPostToPost = (apiPost: ApiPost): Post => ({
  id: apiPost.id,
  user_id: apiPost.author.id,
  username: extractUsernameFromHandle(apiPost.author.handle),
  display_name: apiPost.author.name,
  avatar: apiPost.author.avatar,
  caption: cleanHtmlContent(apiPost.content),
  hashtags: extractHashtags(apiPost.content),
  media_url: apiPost.attachment?.url,
  media_type: apiPost.attachment?.type,
  likes_count: apiPost.likesCount || 0,
  comments_count: apiPost.repliesCount || 0,
  created_at: apiPost.createdAt
});

const mapApiPostToComment = (apiPost: ApiPost): Comment => ({
  id: apiPost.id,
  user_id: apiPost.author.id,
  username: extractUsernameFromHandle(apiPost.author.handle),
  display_name: apiPost.author.name,
  avatar: apiPost.author.avatar,
  content: cleanHtmlContent(apiPost.content),
  likes_count: apiPost.likesCount || 0,
  created_at: apiPost.createdAt,
  replies: []
});

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<ApiResponse>(
          `/federation/posts/${encodeURIComponent(id!)}/with-replies`
        );

        setPost(mapApiPostToPost(data.post));
        setComments(data.replies.items.map(mapApiPostToComment));
        setNextCursor(data.replies.next || null);
        setIsLiked(data.post.likedByMe || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [id]);

  const handleLike = async () => {
    try {
      // Call your API to like/unlike the post
      const response = await fetch(`http:localhost:3500/api/posts/${id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Include auth token if needed
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setPost(prev => prev ? {
          ...prev,
          likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1
        } : null);
      }
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  if (isLoading) {
    return <div className="post-detail-container">Loading...</div>;
  }

  if (error) {
    return <div className="post-detail-container">Error: {error}</div>;
  }

  if (!post) {
    return <div className="post-detail-container">Post not found</div>;
  }

  return (
    <div className="post-detail-container">
      {/* Header */}
      <div className="post-detail-header">
        <div className="post-detail-header-content">
          <div className="post-detail-header-nav">
            <Link to="/">
              <button className="post-detail-back-btn">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="post-detail-header-info">
              <h1>Post</h1>
              <p>@{post.username}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="post-detail-main">

        <div className="post-detail-card">

          <div className="post-detail-post-header">
            <div className="post-detail-user-info">
              <div className="post-detail-avatar">
                {post.avatar ? (
                  <img src={post.avatar} alt={post.display_name} />
                ) : (
                  post.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="post-detail-user-details">
                <h3>{post.display_name}</h3>
                <p className="post-detail-username">@{post.username}</p>
                <p className="post-detail-timestamp">
                  {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <div className="post-detail-caption">
            <p className="post-detail-caption-text">{post.caption}</p>
            {post.hashtags.length > 0 && (
              <div className="post-detail-hashtags">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="post-detail-hashtag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {post.media_url && (
            <div className="post-detail-media">
              {post.media_type === 'image' ? (
                <img src={post.media_url} alt="Post content" className="post-detail-image" />
              ) : (
                <video controls className="post-detail-video">
                  <source src={post.media_url} type={`video/${post.media_url.split('.').pop()}`} />
                </video>
              )}
            </div>
          )}

          <div className="post-detail-actions">
            <div className="post-detail-actions-container">
              <div className="post-detail-actions-left">
                <div className="post-detail-comment-count">
                  <MessageCircle className="w-7 h-7" />
                  <span className="post-detail-action-count">{post.comments_count.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="post-detail-comments">
            <CommentSection
              postId={post.id}
              comments={comments}
              onAddComment={(content) => {
                console.log('Adding comment:', content);
              }}
              onLikeComment={(commentId) => {
                console.log('Liking comment:', commentId);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;