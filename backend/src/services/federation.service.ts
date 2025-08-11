import { type Context, Collection, CollectionPage, type Object, isActor } from "@fedify/fedify";
import logger from "../logger.ts";
import { cachedLookupObject } from '../federation/lookup.ts';
import { normaliseLink } from "../utils/federation.util.ts";
import type { PaginatedResponse, FederatedUserList } from "../types/federation.types.ts";


export async function transformFederatedUser(
  item: unknown,
): Promise<FederatedUserList | null> {
  if (!isActor(item) || !item.id || !item.preferredUsername) {
    return null;
  }

  const icon = await item.getIcon();
  const iconUrl = normaliseLink(icon?.url);

  return {
    id: item.id.href,
    handle: `@${item.preferredUsername}@${new URL(item.id.href).hostname}`,
    name: item.name ?? item.preferredUsername,
    avatar: iconUrl?.href,
  };
}

export async function getCollectionItems<T>(
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

export async function getFederatedUserCollection(
  ctx: Context<unknown>,
  userId: string,
  collectionType: 'followers' | 'following',
  page?: string,
): Promise<PaginatedResponse<FederatedUserList>> {
  const userObject = await cachedLookupObject(ctx, userId);

  if (!userObject || !isActor(userObject)) {
    throw new Error('User not found.');
  }

  const collectionId =
    collectionType === 'followers'
      ? userObject.followersId?.href
      : userObject.followingId?.href;

  if (!collectionId) {
    throw new Error(`${collectionType} collection not found.`);
  }

  const collection = await cachedLookupObject(ctx, collectionId);

  if (!(collection instanceof Collection)) {
    throw new Error(`Valid ${collectionType} collection not found.`);
  }

  return getCollectionItems(ctx, collection, page, transformFederatedUser);
}