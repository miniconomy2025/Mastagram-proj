import { api } from "@/lib/api";
import { FederatedPost } from "@/types/federation";


// Type for saved post response
interface SavedPost extends FederatedPost {
  savedAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

// Save a post
export const savePost = async (userId: string, post: FederatedPost): Promise<boolean> => {
  try {
    const response = await api.post<{ saved: boolean }>('/saved-posts', {
      userId,
      post
    });
    return response.saved;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
};

// Unsave a post
export const unsavePost = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const response = await api.delete<{ saved: boolean }>('/saved-posts', {
      data: { userId, postId }
    });
    return !response.saved;
  } catch (error) {
    console.error('Error unsaving post:', error);
    throw error;
  }
};

// Get all saved posts for a user
export const getSavedPosts = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<SavedPost>> => {
  try {
    return await api.get<PaginatedResponse<SavedPost>>(
      `/saved-posts/${userId}`,
      { params: { page, limit } }
    );
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    throw error;
  }
};

// Check if a post is saved by a user
export const isPostSaved = async (
  userId: string,
  postId: string
): Promise<{ isSaved: boolean; savedAt?: string }> => {
  try {
    return await api.get<{ isSaved: boolean; savedAt?: string }>(
      `/saved-posts/${userId}/${postId}`
    );
  } catch (error) {
    console.error('Error checking saved status:', error);
    throw error;
  }
};

// Toggle save/unsave a post
export const toggleSavePost = async (
  userId: string,
  post: FederatedPost
): Promise<boolean> => {
  const { isSaved } = await isPostSaved(userId, post.id);
  if (isSaved) {
    return await unsavePost(userId, post.id);
  } else {
    return await savePost(userId, post);
  }
};

// Bulk check saved status for multiple posts
export const checkBulkSavedStatus = async (
  userId: string,
  postIds: string[]
): Promise<Record<string, boolean>> => {
  try {
    const results = await Promise.all(
      postIds.map(postId => isPostSaved(userId, postId))
    );
    
    return postIds.reduce((acc, postId, index) => {
      acc[postId] = results[index].isSaved;
      return acc;
    }, {} as Record<string, boolean>);
  } catch (error) {
    console.error('Error checking bulk saved status:', error);
    throw error;
  }
};