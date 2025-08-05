import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { CommentSection } from '@/components/CommentSection';
import './PostDetail.css';

interface Post {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar?: string;
  caption: string;
  hashtags: string[];
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  likes_count: number;
  created_at: string;
  replies?: Comment[];
}

// Mock data
const mockPost: Post = {
  id: 'post1',
  user_id: 'user1',
  username: 'travel_enthusiast',
  display_name: 'Alex Johnson',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel',
  caption: 'Amazing sunset at the beach! 🌅 Perfect end to a beautiful day. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  hashtags: ['sunset', 'beach', 'paradise', 'vacation'],
  media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
  media_type: 'image',
  likes_count: 1247,
  comments_count: 89,
  created_at: '2024-01-15T18:30:00Z'
};

const mockComments: Comment[] = [
  {
    id: 'comment1',
    user_id: 'user2',
    username: 'beach_lover',
    content: 'Absolutely stunning! Where is this beautiful place?',
    likes_count: 15,
    created_at: '2024-01-15T19:00:00Z',
    replies: [
      {
        id: 'reply1',
        user_id: 'user1',
        username: 'travel_enthusiast',
        content: 'Thanks! This is Maldives, absolutely magical place 🏝️',
        likes_count: 8,
        created_at: '2024-01-15T19:15:00Z'
      }
    ]
  },
  {
    id: 'comment2',
    user_id: 'user3',
    username: 'photographer_pro',
    content: 'The lighting in this shot is incredible! What camera did you use?',
    likes_count: 23,
    created_at: '2024-01-15T20:30:00Z'
  }
];

const PostDetail = () => {
  const { id } = useParams();
  const [post] = useState<Post>(mockPost);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleAddComment = (content: string) => {
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      user_id: 'current_user',
      username: 'you',
      content,
      likes_count: 0,
      created_at: new Date().toISOString()
    };
    setComments(prev => [newComment, ...prev]);
  };

  const handleAddReply = (commentId: string, content: string) => {
    const newReply: Comment = {
      id: `reply_${Date.now()}`,
      user_id: 'current_user',
      username: 'you',
      content,
      likes_count: 0,
      created_at: new Date().toISOString()
    };

    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...(comment.replies || []), newReply] }
        : comment
    ));
  };

  const handleLikeComment = (commentId: string) => {
    // Mock implementation - would normally update comment likes in database
    console.log('Liked comment:', commentId);
  };

  return (
    <div className="post-detail-container">
      {/* Header */}
      <div className="post-detail-header">
        <div className="post-detail-header-content">
          <div className="post-detail-header-nav">
            <Link to="/feed">
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
        {/* Post */}
        <div className="post-detail-card">
          {/* Post Header */}
          <div className="post-detail-post-header">
            <div className="post-detail-user-info">
              <div className="post-detail-avatar">
                {post.username.charAt(0).toUpperCase()}
              </div>
              <div className="post-detail-user-details">
                <h3>
                  {post.display_name || post.username}
                </h3>
                <p className="post-detail-username">@{post.username}</p>
                <p className="post-detail-timestamp">
                  {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button className="post-detail-more-btn">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Caption */}
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

          {/* Media */}
          <div className="post-detail-media">
            <img
              src={post.media_url}
              alt="Post content"
              className="post-detail-image"
            />
          </div>

          {/* Actions */}
          <div className="post-detail-actions">
            <div className="post-detail-actions-container">
              <div className="post-detail-actions-left">
                <button
                  onClick={handleLike}
                  className={`post-detail-like-btn ${isLiked ? 'liked' : ''}`}
                >
                  <Heart className="w-7 h-7" />
                  <span className="post-detail-action-count">{likesCount.toLocaleString()}</span>
                </button>
                
                <div className="post-detail-comment-count">
                  <MessageCircle className="w-7 h-7" />
                  <span className="post-detail-action-count">{comments.length}</span>
                </div>
              </div>
              
              <button className="post-detail-share-btn">
                <Share className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="post-detail-comments">
            <CommentSection
              postId={post.id}
              comments={comments}
              onAddComment={handleAddComment}
              onAddReply={handleAddReply}
              onLikeComment={handleLikeComment}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;