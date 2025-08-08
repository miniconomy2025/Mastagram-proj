import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { FederatedPost } from '@/types/federation';
import { useQuery } from '@tanstack/react-query';

export const useSocialActions = () => {
  const { toast } = useToast();

  const [likedPosts, setLikedPosts] = useState(new Set<string>());
  const [followingUsers, setFollowingUsers] = useState(new Set<string>());
  const [savedPosts, setSavedPosts] = useState<Record<string, FederatedPost>>({});


  const {
    refetch: fetchSavedPosts,
    data: serverSavedPosts = []
  } = useQuery<FederatedPost[]>({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      const response = await api.get<{ items: FederatedPost[] }>('/saved-posts');
      const newSavedPosts = response.items.reduce((acc, post) => {
        if (post) acc[post.id] = post;
        return acc;
      }, {} as Record<string, FederatedPost>);
      setSavedPosts(newSavedPosts);
      return response.items;
    },
    enabled: false, 
    initialData: [] 
  });

  const followUser = useCallback(async (userId: string, username: string) => {
    try {
      await api.post(`/follow/${encodeURIComponent(username)}`);
      setFollowingUsers(prev => new Set(prev).add(username));
      toast({
        title: "Following",
        description: `You are now following ${username}`,
      });
    } catch (error) {
      console.error('Follow failed:', error);
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const unfollowUser = useCallback(async (userId: string, username: string) => {
    try {
      await api.delete(`/follow/${encodeURIComponent(username)}`);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
      toast({
        title: "Unfollowed",
        description: `You unfollowed ${username}`,
      });
    } catch (error) {
      console.error('Unfollow failed:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const savePost = useCallback(async (post: FederatedPost) => {
    try {
      await api.post('/saved-posts', { post });
      setSavedPosts(prev => ({ ...prev, [post.id]: post }));
      toast({
        title: "Post saved",
        description: "Post added to your saved collection",
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const unsavePost = useCallback(async (postId: string) => {
    try {
      await api.delete(`/saved-posts/${encodeURIComponent(postId)}`);
      setSavedPosts(prev => {
        const newPosts = { ...prev };
        delete newPosts[postId];
        return newPosts;
      });
      toast({
        title: "Post removed",
        description: "Post removed from saved collection",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove post",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const toggleSavePost = useCallback(async (post: FederatedPost) => {
    return isSaved(post.id) ? unsavePost(post.id) : savePost(post);
  }, [savePost, unsavePost]);

  const likePost = useCallback(async (postId: string) => {
    try {
      await api.post(`/feed/like?postId=${encodeURIComponent(postId)}`);
      setLikedPosts(prev => new Set(prev).add(postId));
      toast({
        title: 'Post liked!',
        description: 'The post has been successfully liked.',
      });
    } catch (error) {
      console.error('Like failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to like post. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const unlikePost = useCallback(async (postId: string) => {
    try {
      await api.post(`/feed/unlike?postId=${encodeURIComponent(postId)}`);
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      toast({
        title: 'Post unliked.',
        description: 'The post has been successfully unliked.',
      });
    } catch (error) {
      console.error('Unlike failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to unlike post. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const isFollowing = useCallback((userId: string) => {
    return followingUsers.has(userId);
  }, [followingUsers]);

  const isSaved = useCallback((postId: string) => {
    return Boolean(savedPosts[postId]);
  }, [savedPosts]);

  const isLiked = useCallback((postId: string) => {
    return likedPosts.has(postId);
  }, [likedPosts]);

  const savedPostsArray = useMemo(() => Object.values(savedPosts), [savedPosts]);

  return {
    followUser,
    unfollowUser,
    savePost,
    unsavePost,
    toggleSavePost,
    likePost,
    unlikePost,
    fetchSavedPosts,
    isFollowing,
    isSaved,
    isLiked,
    likedPosts,
    followingUsers: Array.from(followingUsers),
    savedPosts: savedPostsArray,
    likedPostsSet: likedPosts,
    followingUsersSet: followingUsers,
    savedPostsMap: savedPosts
  };
};