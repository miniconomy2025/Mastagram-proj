import { Router } from "express";
import federation, { createContext } from "../federation/federation.ts";
import logger from "../logger.ts";
import { cachedLookupObject } from "../federation/lookup.ts";
import { isActor, type Actor, Note, type Collection } from "@fedify/fedify";
import { fetchCollectionItems, getFollowersAndFollowingCount } from "../utils/fetch.util.ts";

const federationRouter = Router();

type FederatedUser = {
    id: string,
    handle: string,
    name: string,
    bio: string,
    // iso 8601 date time
    createdAt: string | null,
    followers: number;
    following: number;
};

type FederatedUserList = {
    id: string;
    handle: string;
    name: string;
    avatar: string | null;
};

type PaginatedResponse<T> = {
    items: T[];
    total: number;
    next?: string;
};

federationRouter.get('/users/:userId', async (req, res) => {
    logger.info`fetching user ${req.params.userId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, req.params.userId);

    if (!object || !isActor(object) || !object.id || !isActor(object) || !object.preferredUsername) {
        res.status(404);
        res.json();
        return;
    }

    console.debug`fetched followers: ${object.followersId?.href}`;

    const { followersCount, followingCount } = await getFollowersAndFollowingCount(
        object.followersId?.href ?? "",
        object.followingId?.href ?? ""
    );

    const user: FederatedUser = {
        id: object.id.href,
        handle: `@${object.preferredUsername}@${object.id.hostname}`,
        name: object.name as (string | null) ?? (object.preferredUsername as string),
        bio: object.summary as (string | null) ?? '',
        createdAt: object.published?.toString() ?? null,
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
    }

    res.json(user);
});


// New endpoint to get followers list
federationRouter.get('/users/:userId/followers', async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = req.query.page?.toString() || undefined;
        logger.info(`Fetching followers for ${userId}`);

        const ctx = createContext(federation, req);
        const object = await cachedLookupObject(ctx, userId);

        if (!object || !isActor(object) || !object.followersId) {
            return res.status(404).json({ error: "User or followers collection not found" });
        }

        const collection = await cachedLookupObject(ctx, object.followersId.href) as Collection;

        logger.info`fetched followers collection: ${JSON.stringify(await collection.toJsonLd())}`;
        const { items, total, next } = await fetchCollectionItems(
            ctx,
            collection,
            page,
            async (item) => {
                console.debug`processing item is user?: ${isActor(item)}`;
                if (!isActor(item) || !item.id) return null;
                return {
                    id: item.id.href,
                    handle: `@${item.preferredUsername}@${new URL(item.id.href).hostname}`,
                    name: item.name ?? item.preferredUsername,
                    // avatar: typeof item.icon === 'string' ? item.icon : item.icon?.url ?? null
                };
            }
        );

        const response: PaginatedResponse<FederatedUserList> = {
            items: items.filter(Boolean) as FederatedUserList[],
            total,
            next
        };

        return res.json(response);
    } catch (error) {
        logger.error(`Error fetching followers: ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// New endpoint to get following list
federationRouter.get('/users/:userId/following', async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = req.query.page?.toString() || undefined;
        logger.info(`Fetching following for ${userId}`);

        const ctx = createContext(federation, req);
        const object = await cachedLookupObject(ctx, userId);

        if (!object || !isActor(object) || !object.followingId) {
            return res.status(404).json({ error: "User or following collection not found" });
        }

        const collection = await cachedLookupObject(ctx, object.followingId.href ?? "") as Collection;
        const { items, total, next } = await fetchCollectionItems(
            ctx,
            collection,
            page,
            async (item) => {
                if (!isActor(item) || !item.id) return null;
                return {
                    id: item.id.href,
                    handle: `@${item.preferredUsername}@${new URL(item.id.href).hostname}`,
                    name: item.name ?? item.preferredUsername,
                    // avatar: typeof item.icon === 'string' ? item.icon : item.icon?.url ?? null
                };
            }
        );

        const response: PaginatedResponse<FederatedUserList> = {
            items: items.filter(Boolean) as FederatedUserList[],
            total,
            next
        };

        return res.json(response);
    } catch (error) {
        logger.error(`Error fetching following: ${error}`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

type FederatedNote = {
    id: string,
    author: {
        id: string,
        handle: string,
        name: string,
    },
    content: string,
    // iso 8601 datetime
    createdAt: string | null,
};

federationRouter.get('/posts/:postId', async (req, res) => {
    const postId = req.params.postId;
    logger.info`fetching post ${postId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, postId);

    logger.debug`fetched object: ${!!object}`;

    const attribution = await (object?.getAttribution() ?? Promise.resolve(null));

    if (!object || !(object instanceof Note) || !object.id || !object.content || !attribution?.id || !attribution.preferredUsername) {
        logger.warn`invalid object (${object})`;
        res.status(404);
        res.json();
        return;
    }

    const post: FederatedNote = {
        id: object.id.href,
        author: {
            id: attribution.id.href,
            handle: `@${attribution.preferredUsername}@${attribution.id.hostname}`,
            name: attribution.name as (string | null) ?? (attribution.preferredUsername as string),
        },
        content: object.content as string,
        createdAt: object.published?.toString() ?? null,
    };

    res.json(post);
});


export default federationRouter;
