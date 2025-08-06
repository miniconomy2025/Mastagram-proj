import { useState, useEffect, useRef, useCallback } from 'react';
import { SocialPost } from '@/components/SocialPost';
import { Loader2, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getFeeds } from '@/services/federation.service';
import { FederatedPost } from '@/types/federation';
import './Index.css'; 

const Index = () => {
  const [posts, setPosts] = useState<FederatedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchPosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getFeeds(nextCursor);
      
      setHasMore(!!data.next);
      setPosts(prev => [...prev, ...data.items]);
      setNextCursor(data.next ? extractCursor(data.next) : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor, isLoading, hasMore]);

  // Helper function to extract cursor from URL
  const extractCursor = (url: string): string | undefined => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('cursor') || undefined;
    } catch {
      return undefined;
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, []);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchPosts();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, fetchPosts]
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="header-sticky-wrapper">
          <div className="header-flex-container">
            <div className="header-left-section">
              <div className="header-icon-box">
                <Home className="header-icon" />
              </div>
              <div className="header-title-group">
                <h1 className="header-title">Feed</h1>
                <p className="header-subtitle">Discover trending content</p>
              </div>
            </div>
            <div className="header-right-section">
              <Link to="/search">
                <Button variant="ghost" size="icon">
                  <Search className="search-button-icon" />
                </Button>
              </Link>
            </div>
          </div>
     
      </div>

      <main className="main-content">
        {error && (
          <div className="error-message-container">
            <p className="error-text">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPosts}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="retry-button-spinner" />
              ) : null}
              Retry
            </Button>
          </div>
        )}

        {isLoading && posts.length === 0 && (
          <div className="initial-loading-container">
            <Loader2 className="initial-loading-spinner" />
            <p className="loading-text">Loading your feed...</p>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="empty-state-container">
            <div className="empty-state-icon-wrapper">
              <Home className="empty-state-icon" />
            </div>
            <h3 className="empty-state-title">No posts yet</h3>
            <p className="empty-state-message">Check back later for new content!</p>
          </div>
        )}

        <div className="posts-list">
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return (
                <div ref={lastPostRef} key={post.id}>
                  <SocialPost post={post} />
                </div>
              );
            } else {
              return <SocialPost key={post.id} post={post} />;
            }
          })}
        </div>

        {isLoading && posts.length > 0 && (
          <div className="load-more-button-container">
            <Loader2 className="load-more-spinner" />
          </div>
        )}

        {!isLoading && hasMore && posts.length > 0 && (
          <div className="load-more-button-container">
            <Button 
              variant="outline" 
              onClick={fetchPosts}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="retry-button-spinner" />
              ) : null}
              Load More
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
