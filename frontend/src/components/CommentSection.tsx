import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import './CommentSection.css';

interface Comment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  likes_count: number;
  created_at: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onAddReply: (commentId: string, content: string) => void;
  onLikeComment: (commentId: string) => void;
}

export const CommentSection = ({ 
  postId, 
  comments, 
  onAddComment, 
  onAddReply, 
  onLikeComment 
}: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleSubmitReply = (commentId: string) => {
    if (replyContent.trim()) {
      onAddReply(commentId, replyContent);
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleLikeComment = (commentId: string) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
    } else {
      newLiked.add(commentId);
    }
    setLikedComments(newLiked);
    onLikeComment(commentId);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`comment-item ${isReply ? 'reply' : ''}`}>
      <div className="comment-item-header">
        <div className="comment-item-avatar">
          {comment.username.charAt(0).toUpperCase()}
        </div>
        
        <div className="comment-item-content">
          <div className="comment-item-bubble">
            <div className="comment-item-bubble-header">
              <p className="comment-item-username">@{comment.username}</p>
              <button className="comment-item-more-btn">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <p className="comment-item-text">{comment.content}</p>
          </div>
          
          <div className="comment-item-actions">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className={`comment-item-like-btn ${likedComments.has(comment.id) ? 'liked' : ''}`}
            >
              <Heart className="w-4 h-4" />
              <span>{comment.likes_count}</span>
            </button>
            
            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="comment-item-reply-btn"
              >
                Reply
              </button>
            )}
            
            <span className="comment-item-date">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {replyingTo === comment.id && (
            <div className="comment-item-reply-form">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="comment-item-reply-textarea"
              />
              <div className="comment-item-reply-actions">
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim()}
                  className="comment-item-reply-submit-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="comment-item-reply-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {comment.replies?.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">
        Comments ({comments.length})
      </h3>
      
      {/* Add comment */}
      <div className="comment-section-add">
        <div className="comment-section-avatar">
          U
        </div>
        <div className="comment-section-input-container">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="comment-section-textarea"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="comment-section-submit-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="comment-section-empty">
          <MessageCircle className="comment-section-empty-icon" />
          <p className="comment-section-empty-text">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="comment-section-list">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};