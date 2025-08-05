import { useInfiniteFollowing } from '@/hooks/use-infinite-following';
import { useEffect, useRef } from 'react';

interface FollowingListProps {
  userId: string;
}

export const FollowingList = ({ userId }: FollowingListProps) => {
  const { totalFollowing, following, loading, error, hasMore, loadMoreFollowing } = useInfiniteFollowing(userId);
  const observerRef = useRef<IntersectionObserver>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadMoreFollowing();
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadMoreFollowing]);

  if (error) return <div className="error">{error}</div>;
  if (loading && following.length === 0) return <div>Loading...</div>;

  console.log(following)

  return (
    <div className="following-container">
      <h2>Following ({totalFollowing})</h2>
      
      <div className="following-grid">
        {following.map((user) => (
          <div key={user.id} className="following-card">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.handle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="sentinel" />
      
      {loading && following.length > 0 && (
        <div className="loading-indicator">Loading more...</div>
      )}
      
      {!hasMore && following.length > 0 && (
        <div className="end-message">No more users to show</div>
      )}
    </div>
  );
};