import { type Context, Collection, CollectionPage, isActor } from "@fedify/fedify";
import logger from "../logger.ts";

export async function fetchCollectionItems<T>(
  ctx: Context<T>,
  collection: Collection | CollectionPage,
  page?: string,
  mapper?: (item: unknown) => Promise<T | null> | T | null
): Promise<{ items: (T | null)[]; total: number; next?: string }> {
    
  try {
    if (page) {
      const pageObj = await ctx.lookupObject(page);
      if (!pageObj || !(pageObj instanceof CollectionPage)) {
        throw new Error("Invalid collection page");
      }
      return processCollectionPage(ctx, pageObj, mapper);
    }

    if (collection instanceof CollectionPage) {
      return processCollectionPage(ctx, collection, mapper);
    }

    if (collection.firstId) {
      const firstPage = await ctx.lookupObject(collection.firstId.href);
      console.debug(`First page: ${JSON.stringify(await firstPage?.toJsonLd())}`);
      if (firstPage && firstPage instanceof CollectionPage) {
        return processCollectionPage(ctx, firstPage, mapper);
      }
    }

    if (collection.itemIds) {
      return {
        items: await processItems(ctx, collection.itemIds, mapper),
        total: collection.totalItems || collection.itemIds.length,
        next: undefined
      };
    }

    return {
      items: [],
      total: collection.totalItems || 0,
      next: undefined
    };

  } catch (error) {
    logger.error(`Error in fetchCollectionItems: ${error}`);
    throw error;
  }
}

async function processCollectionPage<T>(
  ctx: Context<T>,
  page: CollectionPage,
  mapper?: (item: unknown) => Promise<T | null> | T | null
): Promise<{ items: (T | null)[]; total: number; next?: string }> {

  return {
    items: await processItems(ctx, page.itemIds, mapper),
    total: page.totalItems || page.itemIds.length,
    next: page.nextId?.href
  };
}

async function processItems<T>(
  ctx: Context<T>,
  items: unknown[],
  mapper?: (item: unknown) => Promise<T | null> | T | null
): Promise<(T | null)[]> {
  const results: (T | null)[] = [];

  for (const item of items) {
    try {
      let resolved = item;

      // Resolve URL or object with href
      const href =
        item instanceof URL
          ? item.href
          : typeof item === "object" && item && "href" in item
          ? (item as any).href
          : null;

      if (href) {
        resolved = await ctx.lookupObject(href);
      }


      const mapped = mapper ? await mapper(resolved) : (resolved as T);
      results.push(mapped);
    } catch (error) {
      logger.warn(`Error processing collection item: ${error}`);
      results.push(null);
    }
  }

  return results;
}

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
