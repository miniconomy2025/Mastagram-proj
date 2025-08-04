import { FederatedPost, FederatedUser, PaginatedResponse } from "@/types/federation";

const API_BASE_URL = 'http://localhost:3500/api/federation';

export const getFollowing = async (
  userId: string,
  page?: string
): Promise<PaginatedResponse<FederatedUser>> => {
  try {

    const url = new URL(`${API_BASE_URL}/users/${userId}/following`);
    if (page) url.searchParams.append('page', page);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      items: data.items,
      total: data.total,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching following:', error);
    throw error;
  }
};

export const getFollowers = async (
  userId: string,
  page?: string
): Promise<PaginatedResponse<FederatedUser>> => {
  try {

    const url = new URL(`${API_BASE_URL}/users/${userId}/following`);
    if (page) url.searchParams.append('page', page);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      items: data.items,
      total: data.total,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching following:', error);
    throw error;
  }
};

export const getPosts = async (
  userId: string,
  cursor?: string
): Promise<PaginatedResponse<FederatedPost>> => {
  try {
    const url = new URL(`${API_BASE_URL}/users/${userId}/posts`);
    if (cursor) url.searchParams.append('cursor', cursor);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      items: data.items.filter((item: any) => item !== null) as FederatedPost[],
      total: data.count,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const getFeeds = async (
  cursor?: string
): Promise<PaginatedResponse<FederatedPost>> => {
  try {
    const url = new URL(`${API_BASE_URL}/me/following/posts`);
    if (cursor) url.searchParams.append('cursor', cursor);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      items: data.items.filter((item: any) => item !== null) as FederatedPost[],
      total: data.count,
      next: data.next,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};
