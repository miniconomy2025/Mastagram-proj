import { useState, useEffect } from 'react';
import { Bookmark, Heart, Grid, List } from 'lucide-react';
import { SocialPost } from '@/components/SocialPost';
import { Button } from '@/components/ui/button';
import './Saved.css';

interface SavedPost {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
  caption: string;
  hashtags: string[];
  media_url: string;
  media_type: 'image' | 'video';
  likes_count: number;
  comments_count: number;
  created_at: string;
  saved_at: string;
}

const Saved = () => {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Mock saved posts data
  const mockSavedPosts: SavedPost[] = [
    {
      id: 'saved1',
      user_id: 'user1',
      username: 'recipe_master',
      display_name: 'Chef Antonio',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
      caption: 'Perfect pasta carbonara recipe! 🍝 Authentic Italian style #pasta #recipe #italian #cooking',
      hashtags: ['pasta', 'recipe', 'italian', 'cooking'],
      media_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=400&fit=crop',
      media_type: 'image',
      likes_count: 2456,
      comments_count: 189,
      created_at: '2024-01-14T16:30:00Z',
      saved_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'saved2',
      user_id: 'user2',
      username: 'workout_guru',
      display_name: 'Fitness Jenny',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=workout',
      caption: '15-minute morning routine for energy boost! 💪 Try this tomorrow #workout #morning #fitness #health',
      hashtags: ['workout', 'morning', 'fitness', 'health'],
      media_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
      media_type: 'image',
      likes_count: 1834,
      comments_count: 92,
      created_at: '2024-01-13T07:15:00Z',
      saved_at: '2024-01-14T20:30:00Z'
    },
    {
      id: 'saved3',
      user_id: 'user3',
      username: 'diy_creator',
      display_name: 'Creative Sarah',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diy',
      caption: 'Easy room makeover on a budget! ✨ Transform your space #diy #homedecor #budget #creative',
      hashtags: ['diy', 'homedecor', 'budget', 'creative'],
      media_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
      media_type: 'image',
      likes_count: 3421,
      comments_count: 156,
      created_at: '2024-01-12T14:20:00Z',
      saved_at: '2024-01-13T18:45:00Z'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setSavedPosts(mockSavedPosts);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleUnsave = (postId: string) => {
    setSavedPosts(prev => prev.filter(post => post.id !== postId));
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
                <img
                  src={post.media_url}
                  alt={post.caption}
                  className="saved-grid-image"
                />
                <div className="saved-grid-overlay">
                  <div className="saved-grid-overlay-content">
                    <Heart className="saved-grid-heart" />
                    <span className="saved-grid-likes">{post.likes_count}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="saved-grid-unsave"
                  onClick={() => handleUnsave(post.id)}
                >
                  <Bookmark className="saved-grid-bookmark" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="saved-list">
            {savedPosts.map((post) => (
              <div key={post.id} className="saved-list-item">
                <SocialPost
                  post={{
                    id: post.id,
                    user_id: post.user_id,
                    username: post.username,
                    caption: post.caption,
                    hashtags: post.hashtags,
                    // media_url: post.media_url,
                    // media_type: post.media_type,
                    likes_count: post.likes_count,
                    comments_count: post.comments_count,
                    created_at: post.created_at
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="saved-list-unsave"
                  onClick={() => handleUnsave(post.id)}
                >
                  <Bookmark className="saved-list-bookmark" />
                  Saved
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