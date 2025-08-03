interface FederatedUser {
  id: string;
  handle: string;
  name: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  next?: string;
}

export const getFollowing = async (
  userId: string,
  page?: string
): Promise<PaginatedResponse<FederatedUser>> => {
  try {

    const url = new URL(`http://localhost:3500/api/federation/users/${userId}/following`);
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