import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

let savedPosts = new Set<string>();

export const useSocialActions = () => {
  const { toast } = useToast();

  const [likedPosts, setLikedPosts] = useState(new Set<string>());
  const [followingUsers, setFollowingUsers] = useState(new Set<string>());

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

  const savePost = useCallback(async (postId: string) => {
    try {
      savedPosts.add(postId);
      toast({
        title: "Post saved",
        description: "Post added to your saved collection",

      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    }
  }, [toast]);

  const unsavePost = useCallback(async (postId: string) => {
    try {
      savedPosts.delete(postId);
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
    }
  }, [toast]);

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
    return savedPosts.has(postId);
  }, []);

  const isLiked = useCallback((postId: string) => {
    return likedPosts.has(postId);
  }, [likedPosts]);

  return {
    followUser,
    unfollowUser,
    savePost,
    unsavePost,
    likePost,
    unlikePost,
    isFollowing,
    isSaved,
    isLiked
  };
};