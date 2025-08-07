import { api } from "@/lib/api";
import { FederatedPost, FederatedUser, PaginatedResponse } from "@/types/federation";

const API_BASE_URL = '/federation'; 

export const getFollowing = async (
  userId: string,
  page?: string
): Promise<PaginatedResponse<FederatedUser>> => {
  try {
    const url = `/${API_BASE_URL}/users/${encodeURIComponent(userId)}/following`;
    const params = page ? { page } : undefined;
    
    const data = await api.get<PaginatedResponse<FederatedUser>>(url, { params });
    
    return {
      items: data.items.filter((item): item is FederatedUser => item !== null),
      total: data.total,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching following:', error);
    throw new Error('Failed to fetch following list');
  }
};

export const getFollowers = async (
  userId: string,
  page?: string
): Promise<PaginatedResponse<FederatedUser>> => {
  try {
    const url = `/${API_BASE_URL}/users/${encodeURIComponent(userId)}/followers`;
    const params = page ? { page } : undefined;
    
    const data = await api.get<PaginatedResponse<FederatedUser>>(url, { params });
    
    return {
      items: data.items.filter((item): item is FederatedUser => item !== null),
      total: data.total,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching followers:', error);
    throw new Error('Failed to fetch followers list');
  }
};

export const getPosts = async (
  userId: string,
  cursor?: string
): Promise<PaginatedResponse<FederatedPost>> => {
  try {
    const url = `/${API_BASE_URL}/users/${encodeURIComponent(userId)}/posts`;
    const params = cursor ? { cursor } : undefined;
    
    const data = await api.get<PaginatedResponse<FederatedPost>>(url, { params });
    
    return {
      items: data.items.filter((item): item is FederatedPost => item !== null),
      total: data.total,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw new Error('Failed to fetch user posts');
  }
};

export const getFeeds = async (
  cursor?: string
): Promise<PaginatedResponse<FederatedPost>> => {
  try {
    const url = '/${API_BASE_URL}/me/following/posts';
  
    const params = cursor ? { cursor } : undefined;
    
    const data = await api.get<PaginatedResponse<FederatedPost>>(url, { params });
    
    return {
      items: data.items.filter((item): item is FederatedPost => item !== null),
      total: data.total,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching feed:', error);
    throw new Error('Failed to fetch feed');
  }
};