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

/**
 * Converts ActivityPub handles to proper URLs
 * @param actorId - Either an ActivityPub handle (@username@domain) or a URL string
 * @returns A proper URL string that can be used with the URL constructor
 */
export function convertActivityPubHandleToUrl(actorId: string): string {
  try {
    new URL(actorId);
    return actorId;
  } catch {
  }

  if (actorId.startsWith('@')) {
    try {
      const withoutLeadingAt = actorId.substring(1);
      const parts = withoutLeadingAt.split('@');
      
      if (parts.length === 2) {
        const [username, domain] = parts;
        
        if (username.trim() && domain.trim()) {
          return `https://${domain}/users/${username}`;
        }
      }
    } catch (error) {
      logger.warn(`Failed to parse ActivityPub handle: ${actorId}`, { error });
    }
  }

  return actorId;
}
