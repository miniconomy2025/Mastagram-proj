import { useState, useEffect, useRef, useCallback } from 'react';
import { SocialPost } from '@/components/SocialPost';
import { Loader2, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getPosts } from '@/services/federation.service';
import { FederatedPost } from '@/types/federation';

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
      const data = await getPosts('@Third3King@mastodon.social', nextCursor);
      
      setHasMore(posts.length + data.items.length < data.total);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl text-foreground">Feed</h1>
                <p className="text-muted-foreground text-sm">Discover trending content</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/search">
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pb-8">
        {error && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col items-center">
            <p className="text-destructive text-center font-medium mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPosts}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Retry
            </Button>
          </div>
        )}

        {isLoading && posts.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading your feed...</p>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="mt-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Home className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground">No posts yet</h3>
            <p className="text-muted-foreground">Check back later for new content!</p>
          </div>
        )}

        <div className="space-y-6 mt-6">
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
          <div className="mt-6 flex justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {!isLoading && hasMore && posts.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={fetchPosts}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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