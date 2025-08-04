import { Link } from "@fedify/fedify";
import logger from "../logger.ts";

export async function getFollowersAndFollowingCount(
  followersUrl: string,
  followingUrl: string
): Promise<{ followersCount: number | null; followingCount: number | null }> {
  async function fetchCount(url: string): Promise<number | null> {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/activity+json"
        }
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.totalItems ?? null;
    } catch (err) {
      console.error(`Error fetching count from ${url}:`, err);
      return null;
    }
  }

  const [followersCount, followingCount] = await Promise.all([
    fetchCount(followersUrl),
    fetchCount(followingUrl)
  ]);

  return { followersCount, followingCount };
}

export async function getRepliesCount(url: string | undefined): Promise<number | null> {
    if (!url) return null;
    try {
        const res = await fetch(url, {
            headers: {
                Accept: "application/activity+json"
            }
        });
        if (!res.ok) {
            logger.warn(`Failed to fetch count from ${url}: Status ${res.status}`);
            return null;
        }
        const data = await res.json();
        logger.debug(`Fetched count from ${url}:`, data);
        return data?.first?.items?.length ?? null;
    } catch (err: any) {
        logger.error(`Error fetching count from ${url}:`, err);
        return null;
    }
}

export function normaliseLink(link: URL | Link | null | undefined): URL | undefined {
    if (link instanceof Link) {
        return link.href ?? undefined;
    } else {
        return link ?? undefined;
    }
}
