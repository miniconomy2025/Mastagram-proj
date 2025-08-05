
import { getFollowing } from '@/services/federation.service';
import { useState, useEffect, useCallback } from 'react';

interface FederatedUser {
    id: string;
    handle: string;
    name: string;
}

export const useInfiniteFollowing = (userId: string) => {
    const [following, setFollowing] = useState<FederatedUser[]>([]);
    const [totalFollowing, setTotalFollowing] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextPage, setNextPage] = useState<string | undefined>();

    const loadMoreFollowing = useCallback(async () => {
        // if (loading || !hasMore) return;

        try {
            setLoading(true);
            const data = await getFollowing(userId, nextPage);

            setFollowing(prev => [...prev, ...data.items]);
            setTotalFollowing(data.total);
            setHasMore(!!data.next);
            setNextPage(data.next);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load following');
        } finally {
            setLoading(false);
        }
    }, [nextPage, loading, hasMore]);

    // Reset when userId changes
    useEffect(() => {
        setFollowing([]);
        setTotalFollowing(0);
        setLoading(true);
        setError(null);
        setHasMore(true);
        setNextPage(undefined);
        loadMoreFollowing();
    }, []);

    return { totalFollowing, following, loading, error, hasMore, loadMoreFollowing };
};