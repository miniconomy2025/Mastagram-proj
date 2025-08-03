import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  isFollowing: boolean;
}

interface Post {
  id: string;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
}

// Mock data store for demonstration
let followingUsers = new Set<string>();
let savedPosts = new Set<string>();

export const useSocialActions = () => {
  const { toast } = useToast();

  const followUser = useCallback(async (userId: string, username: string) => {
    try {
      followingUsers.add(userId);
      toast({
        title: "Following",
        description: `You are now following @${username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  }, [toast]);

  const unfollowUser = useCallback(async (userId: string, username: string) => {
    try {
      followingUsers.delete(userId);
      toast({
        title: "Unfollowed",
        description: `You unfollowed @${username}`,
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to unfollow user",
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

  const isFollowing = useCallback((userId: string) => {
    return followingUsers.has(userId);
  }, []);

  const isSaved = useCallback((postId: string) => {
    return savedPosts.has(postId);
  }, []);

  return {
    followUser,
    unfollowUser,
    savePost,
    unsavePost,
    isFollowing,
    isSaved,
  };
};