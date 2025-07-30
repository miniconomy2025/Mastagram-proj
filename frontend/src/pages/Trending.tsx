import { useState, useEffect } from 'react';
import { TrendingUp, Hash, Flame, Star } from 'lucide-react';
import { SocialPost } from '@/components/SocialPost';
import { Button } from '@/components/ui/button';
import './Trending.css';

interface TrendingPost {
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
  trend_score?: number;
}

interface TrendingHashtag {
  tag: string;
  count: number;
  growth: number;
}

const Trending = () => {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock trending data
  const mockTrendingPosts: TrendingPost[] = [
    {
      id: 'trending1',
      user_id: 'viral_user1',
      username: 'viral_creator',
      display_name: 'Emma Stone',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viral1',
      caption: 'This dance trend is taking over! 💃 Who else is trying this? #dancetrend #viral #trending #fun',
      hashtags: ['dancetrend', 'viral', 'trending', 'fun'],
      media_url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=400&fit=crop',
      media_type: 'image',
      likes_count: 45678,
      comments_count: 1234,
      created_at: '2024-01-15T20:00:00Z',
      trend_score: 98
    },
    {
      id: 'trending2',
      user_id: 'viral_user2',
      username: 'trend_setter',
      display_name: 'Jake Williams',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viral2',
      caption: 'New recipe hack that will blow your mind! 🤯 #recipehack #cooking #foodtok #lifehack',
      hashtags: ['recipehack', 'cooking', 'foodtok', 'lifehack'],
      media_url: 'https://images.unsplash.com/photo-1556909114-4e608e762b32?w=400&h=400&fit=crop',
      media_type: 'image',
      likes_count: 32456,
      comments_count: 890,
      created_at: '2024-01-15T19:30:00Z',
      trend_score: 95
    },
    {
      id: 'trending3',
      user_id: 'viral_user3',
      username: 'fashion_forward',
      display_name: 'Zoe Martinez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viral3',
      caption: 'This outfit combination is everything! ✨ #ootd #fashion #style #trendy',
      hashtags: ['ootd', 'fashion', 'style', 'trendy'],
      media_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop',
      media_type: 'image',
      likes_count: 28934,
      comments_count: 567,
      created_at: '2024-01-15T18:45:00Z',
      trend_score: 92
    }
  ];

  const mockTrendingHashtags: TrendingHashtag[] = [
    { tag: 'dancetrend', count: 145000, growth: 78 },
    { tag: 'viral', count: 892000, growth: 45 },
    { tag: 'foodtok', count: 234000, growth: 92 },
    { tag: 'ootd', count: 567000, growth: 34 },
    { tag: 'lifehack', count: 123000, growth: 67 },
    { tag: 'trending', count: 445000, growth: 23 }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setTrendingPosts(mockTrendingPosts);
      setTrendingHashtags(mockTrendingHashtags);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="trending-container">
        <div className="trending-loading">
          <div className="trending-loading-header" />
          <div className="trending-loading-content">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="trending-loading-item" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-container">
      {/* Header */}
      <div className="trending-header">
        <div className="trending-header-content">
          <div className="trending-header-info">
            <div className="trending-icon-wrapper">
              <TrendingUp className="trending-icon" />
            </div>
            <div>
              <h1 className="trending-title">Trending</h1>
              <p className="trending-subtitle">What's hot right now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="trending-content">
        <div className="trending-hashtags">
          <h2 className="trending-section-title">
            <Flame className="trending-section-icon" />
            Trending Hashtags
          </h2>
          <div className="trending-hashtags-grid">
            {trendingHashtags.map((hashtag, index) => (
              <div key={hashtag.tag} className="trending-hashtag-card">
                <div className="trending-hashtag-header">
                  <span className="trending-hashtag-name">#{hashtag.tag}</span>
                  {index < 3 && <Star className="trending-hashtag-star" />}
                </div>
                <p className="trending-hashtag-count">
                  {hashtag.count.toLocaleString()} posts
                </p>
                <div className="trending-hashtag-progress">
                  <div className="trending-hashtag-progress-bg">
                    <div 
                      className="trending-hashtag-progress-bar"
                      style={{ width: `${Math.min(hashtag.growth, 100)}%` }}
                    />
                  </div>
                  <span className="trending-hashtag-growth">+{hashtag.growth}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Posts */}
        <div className="trending-posts">
          <h2 className="trending-section-title">
            <Hash className="trending-section-icon" />
            Viral Posts
          </h2>
          <div className="trending-posts-list">
            {trendingPosts.map((post) => (
              <div key={post.id} className="trending-post-item">
                {post.trend_score && post.trend_score > 90 && (
                  <div className="trending-post-badge">
                    🔥 HOT
                  </div>
                )}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trending;