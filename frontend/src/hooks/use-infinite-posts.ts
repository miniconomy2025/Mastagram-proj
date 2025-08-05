// hooks/useInfinitePosts.ts
import { useState, useEffect, useCallback } from 'react';
import { getPosts } from '@/services/federation.service';
import { FederatedPost } from '@/types/federation';

export const useInfinitePosts = (userId: string) => {
    const [posts, setPosts] = useState<FederatedPost[]>([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | undefined>();

    const loadMorePosts = useCallback(async () => {
        if (loading || !hasMore) return;

        try {
            setLoading(true);
            const data = await getPosts(userId, nextCursor);

            setPosts(prev => [...prev, ...data.items]);
            setTotalPosts(data.total);
            setHasMore(!!data.next);
            setNextCursor(data.next ? extractCursor(data.next) : undefined);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [nextCursor, loading, hasMore, userId]);

    // Helper function to extract cursor from URL
    const extractCursor = (url: string): string | undefined => {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get('cursor') || undefined;
        } catch {
            return undefined;
        }
    };

    // Reset when userId changes
    useEffect(() => {
        setPosts([]);
        setTotalPosts(0);
        setLoading(true);
        setError(null);
        setHasMore(true);
        setNextCursor(undefined);
        loadMorePosts();
    }, [userId]);

    return {
        totalPosts,
        posts,
        loading,
        error,
        hasMore,
        loadMorePosts
    };
};