import { useState, useEffect } from 'react';
import { Bookmark, Heart, Grid, List } from 'lucide-react';
import { SocialPost } from '@/components/SocialPost';
import { Button } from '@/components/ui/button';
import { useSocialActions } from '@/hooks/use-social-actions';
import { useQuery } from '@tanstack/react-query';
import './Saved.css';

const Saved = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const {
    savedPosts,
    unsavePost,
    isSaved,
    fetchSavedPosts
  } = useSocialActions();

  const { isLoading } = useQuery({
    queryKey: ['saved-posts-client'],
    queryFn: async () => {
      const result = await fetchSavedPosts();
      return result.data || [];
    },
    initialData: savedPosts 
  });

  const handleUnsave = async (postId: string) => {
    try {
      await unsavePost(postId);
    } catch (error) {
      console.error('Failed to unsave post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="saved-container">
        <div className="saved-loading">
          <div className="saved-loading-header" />
          <div className="saved-loading-content">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="saved-loading-item" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-container">
      {/* Header */}
      <div className="saved-header">
        <div className="saved-header-content">
          <div className="saved-header-info">
            <div className="saved-header-left">
              <div className="saved-icon-wrapper">
                <Bookmark className="saved-icon" />
              </div>
              <div>
                <h1 className="saved-title">Saved</h1>
                <p className="saved-subtitle">{savedPosts.length} saved posts</p>
              </div>
            </div>

            <div className="saved-view-buttons">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="saved-view-icon" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="saved-view-icon" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="saved-content">
        {savedPosts.length === 0 ? (
          <div className="saved-empty">
            <div className="saved-empty-icon">
              <Bookmark className="saved-empty-bookmark" />
            </div>
            <h3 className="saved-empty-title">No saved posts yet</h3>
            <p className="saved-empty-text">
              Tap the bookmark icon on posts you want to save for later
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="saved-grid">
            {savedPosts.map((post) => (
              <div key={post.id} className="saved-grid-item">
                {post.attachment?.url && (
                  <img
                    src={post.attachment.url}
                    alt={post.author.name}
                    className="saved-grid-image"
                  />
                )}
                <div className="saved-grid-overlay">
                  <div className="saved-grid-overlay-content">
                    <Heart className="saved-grid-heart" />
                    <span className="saved-grid-likes">{post.likesCount || 0}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="saved-grid-unsave"
                  onClick={() => handleUnsave(post.id)}
                >
                  <Bookmark className="saved-grid-bookmark" fill={isSaved(post.id) ? 'currentColor' : 'none'} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="saved-list">
            {savedPosts.map((post) => (
              <div key={post.id} className="saved-list-item">
                <SocialPost post={post} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="saved-list-unsave"
                  onClick={() => handleUnsave(post.id)}
                >
                  <Bookmark className="saved-list-bookmark" fill={isSaved(post.id) ? 'currentColor' : 'none'} />
                  {isSaved(post.id) ? 'Saved' : 'Save'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;