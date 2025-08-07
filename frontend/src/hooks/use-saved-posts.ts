import { useState, useEffect, useCallback } from 'react';
import {
  savePost,
  unsavePost,
  getSavedPosts,
  isPostSaved,
  toggleSavePost
} from '../services/saved-posts.service';
import { FederatedPost } from '@/types/federation';

export const useSavedPosts = (userId: string) => {
  const [savedPosts, setSavedPosts] = useState<FederatedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalSaved, setTotalSaved] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSavedPosts = useCallback(
    async (page: number = 1, limit: number = 20) => {
      setLoading(true);
      try {
        const { items, total, hasMore } = await getSavedPosts(userId, page, limit);
        setSavedPosts(prev => (page === 1 ? items : [...prev, ...items]));
        setTotalSaved(total);
        setHasMore(hasMore);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const handleSavePost = useCallback(
    async (post: FederatedPost) => {
      try {
        const saved = await savePost(userId, post);
        if (saved) {
          setSavedPosts(prev => [post, ...prev]);
          setTotalSaved(prev => prev + 1);
        }
        return saved;
      } catch (err) {
        setError(err as Error);
        return false;
      }
    },
    [userId]
  );

  const handleUnsavePost = useCallback(
    async (postId: string) => {
      try {
        const unsaved = await unsavePost(userId, postId);
        if (unsaved) {
          setSavedPosts(prev => prev.filter(p => p.id !== postId));
          setTotalSaved(prev => prev - 1);
        }
        return unsaved;
      } catch (err) {
        setError(err as Error);
        return false;
      }
    },
    [userId]
  );

  const handleToggleSave = useCallback(
    async (post: FederatedPost) => {
      try {
        return await toggleSavePost(userId, post);
      } catch (err) {
        setError(err as Error);
        return false;
      }
    },
    [userId]
  );

  const checkIsSaved = useCallback(
    async (postId: string) => {
      try {
        return await isPostSaved(userId, postId);
      } catch (err) {
        setError(err as Error);
        return { isSaved: false };
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) {
      fetchSavedPosts();
    }
  }, [userId, fetchSavedPosts]);

  return {
    savedPosts,
    loading,
    error,
    totalSaved,
    hasMore,
    fetchMore: () => fetchSavedPosts(Math.ceil(savedPosts.length / 20) + 1),
    savePost: handleSavePost,
    unsavePost: handleUnsavePost,
    toggleSavePost: handleToggleSave,
    isPostSaved: checkIsSaved,
    refresh: () => fetchSavedPosts()
  };
};