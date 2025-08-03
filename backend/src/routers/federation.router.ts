import { Router } from "express";
import federation, { createContext } from "../federation/federation.ts";
import logger from "../logger.ts";
import { cachedLookupObject } from "../federation/lookup.ts";
import { Collection, CollectionPage, Create, Document, Image, isActor, Link, Note, Object, Video, type Context } from "@fedify/fedify";
import base64url from "base64url";

const UNEXPECTED_ERROR = 'An unexpected error has occurred.';

function normaliseLink(link: URL | Link | null | undefined): URL | undefined {
    if (link instanceof Link) {
        return link.href ?? undefined;
    } else {
        return link ?? undefined;
    }
}

type PaginatedList<T> = {
    items: T[],
    next?: string,
    count?: number,
};

async function readCollection(ctx: Context<unknown>, collection: Collection | CollectionPage): Promise<{ items: Object[], next?: URL }> {
    const first = await collection.getFirst();
        
    if (first)
        return await readCollection(ctx, first);

    const itemsPromise = await collection.getItems();
    
    const items: Object[] = [];

    for await (const item of itemsPromise) {
        if (item instanceof Link) {
            if (item.href) {
                const object = await cachedLookupObject(ctx, item.href.href);
                if (object)
                    items.push(object);
            }
        } else {
            items.push(item);
        }
    }

    const next = collection instanceof CollectionPage ? collection.nextId : null;

    return {
        items,
        next: next ?? undefined,
    };
}

async function readCollectionIds(ctx: Context<unknown>, collection: Collection | CollectionPage): Promise<{ items: URL[], next?: URL }> {
    const first = await collection.getFirst();
        
    if (first)
        return await readCollectionIds(ctx, first);

    const next = collection instanceof CollectionPage ? collection.nextId : null;

    return {
        items: collection.itemIds,
        next: next ?? undefined,
    };
}

async function objectToUser(object: unknown): Promise<FederatedUser | null> {
    if (!isActor(object) || !object.id || !object.preferredUsername) {
        return null;
    }

    const icon = await object.getIcon();
    const iconUrl = normaliseLink(icon?.url);

    const image = await object.getImage();
    const imageUrl = normaliseLink(image?.url);

    const user: FederatedUser = {
        id: object.id.href,
        handle: `@${object.preferredUsername}@${object.id.hostname}`,
        name: object.name as (string | null) ?? (object.preferredUsername as string),
        bio: object.summary as (string | null) ?? '',
        avatarUrl: iconUrl?.href,
        splashUrl: imageUrl?.href,
        createdAt: object.published?.toString(),
    };

    return user;
}

async function objectToPost(object: unknown): Promise<FederatedPost | null> {
    if (!(object instanceof Note) || !object.id || !object.content) {
        logger.warn`malformed post, ${object}`;
        return null;
    }

    const attribution = await object?.getAttribution();

    if (!attribution?.id || !attribution.preferredUsername) {
        logger.warn`malformed post attribution, ${attribution}`;
        return null;
    }

    let attachment: FederatedAttachment | undefined;

    for await (const att of await object.getAttachments()) {
        if (att instanceof Link && att.href?.href) {
            if (att.mediaType?.startsWith('image/')) {
                attachment = {
                    type: 'image',
                    name: (att.name ?? undefined) as string | undefined,
                    url: att.href?.href,
                };
                break;
            } else if (att.mediaType?.startsWith('video/')) {
                attachment = {
                    type: 'video',
                    name: (att.name ?? undefined) as string | undefined,
                    url: att.href?.href,
                };
                break;
            }
        } else if (att instanceof Document && att.mediaType) {
            const url = normaliseLink(att.url);
            if (url) {
                if (att.mediaType?.startsWith('image/')) {
                    attachment = {
                        type: 'image',
                        name: (att.name ?? undefined) as string | undefined,
                        url: url.href,
                    };
                    break;
                } else if (att.mediaType?.startsWith('video/')) {
                    attachment = {
                        type: 'video',
                        name: (att.name ?? undefined) as string | undefined,
                        url: url.href,
                    };
                    break;
                }
            }
        } else if (att instanceof Image) {
            const url = normaliseLink(att.url)?.href;
            if (url) {
                attachment = {
                    type: 'image',
                    name: (att.name ?? undefined) as string | undefined,
                    url,
                };
                break;
            }
        } else if (att instanceof Video) {
            const url = normaliseLink(att.url);
            if (url) {
                attachment = {
                    type: 'video',
                    name: (att.name ?? undefined) as string | undefined,
                    url: url.href,
                }
            }
        }
    }

    const replyTarget = await object.getReplyTarget();
    const isReplyTo = replyTarget instanceof Object ? replyTarget.id : replyTarget?.href;

    const post: FederatedPost = {
        id: object.id.href,
        author: {
            id: attribution.id.href,
            handle: `@${attribution.preferredUsername}@${attribution.id.hostname}`,
            name: attribution.name as (string | null) ?? (attribution.preferredUsername as string),
        },
        content: object.content as string,
        contentMediaType: normaliseMediaType(object.mediaType),
        attachment,
        isReplyTo: isReplyTo?.href,
        createdAt: object.published?.toString(),
    };

    return post;
}

const federationRouter = Router();

type FederatedUser = {
    id: string,
    handle: string,
    name: string,
    bio: string,
    avatarUrl?: string,
    splashUrl?: string,
    // iso 8601 date time
    createdAt?: string,
};

federationRouter.get('/users/:userId', async (req, res) => {
    logger.info`fetching user ${req.params.userId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, req.params.userId);

    const user = await objectToUser(object);

    if (!user) {
        res.status(404);
        res.json({
            message: 'User not found.',
        });
        return;
    }

    res.json(user);
});

federationRouter.get('/users/:userId/posts', async (req, res) => {
    logger.info`fetching user ${req.params.userId} posts`;

    const ctx = createContext(federation, req);
    const userObject = await cachedLookupObject(ctx, req.params.userId);

    if (!isActor(userObject)) {
        res.status(404);
        res.json({
            message: 'User not found.',
        });
        return;
    }

    let outbox: Collection | null = null;

    if (req.query.cursor && typeof req.query.cursor === 'string') {
        try {
            logger.debug`cursor is specified`;
            const cursor = req.query.cursor;
            const cursorId = base64url.default.decode(cursor);
            logger.debug`cursor decoded as ${cursorId}`;
            const outboxObject = await cachedLookupObject(ctx, cursorId);

            if (outboxObject instanceof Collection) {
                outbox = outboxObject;
            }
        } catch {}
    } else {
        outbox = await userObject.getOutbox();
    }

    if (!outbox) {
        logger.error`user has no outbox`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    let outboxItems = await readCollection(ctx, outbox);

    const items = (await Promise.all(outboxItems.items.map(async item => {
        if (item instanceof Create && item.objectId) {
            const object = await cachedLookupObject(ctx, item.objectId.href);
            if (object)
                return await objectToPost(object);
        }
        return null;
    }))).filter(item => !!item);

    const nextCursor = outboxItems.next
        ? base64url.default.encode(outboxItems.next.href)
        : undefined;

    const response: PaginatedList<FederatedPost> = {
        items,
        next: `/api/federation/users/${encodeURIComponent(req.params.userId)}/posts?cursor=${nextCursor}`,
        count: outbox.totalItems ?? undefined,
    };
    res.json(response);
});

federationRouter.get('/users/:userId/followers', async (req, res) => {
    const userId = req.params.userId;
    logger.info`fetching user ${userId} followers`;

    const ctx = createContext(federation, req);
    const userObject = await cachedLookupObject(ctx, userId);

    if (!isActor(userObject)) {
        res.status(404);
        res.json({
            message: 'User not found.',
        });
        return;
    }

    let followers: Collection | null = null;

    if (req.query.cursor && typeof req.query.cursor === 'string') {
        try {
            logger.debug`cursor is specified`;
            const cursor = req.query.cursor;
            const cursorId = base64url.default.decode(cursor);
            logger.debug`cursor decoded as ${cursorId}`;
            const followersObject = await cachedLookupObject(ctx, cursorId);

            if (followersObject instanceof Collection) {
                followers = followersObject;
            }
        } catch {}
    } else {
        followers = await userObject.getFollowers();
    }

    if (!followers) {
        logger.error`user has no followers collection`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    let followerItems;
    
    try {
        followerItems = await readCollectionIds(ctx, followers)
    } catch (error) {
        logger.error`error reading followers collection: ${error}`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    const nextCursor = followerItems.next
        ? base64url.default.encode(followerItems.next.href)
        : undefined;

    const response: PaginatedList<string> = {
        items: followerItems.items.map(item => item.href),
        next: `/api/federation/users/${encodeURIComponent(userId)}/followers?cursor=${nextCursor}`,
        count: followers.totalItems ?? undefined,
    };
    res.json(response);
});

federationRouter.get('/users/:userId/following', async (req, res) => {
    const userId = req.params.userId;
    logger.info`fetching user ${userId} following`;

    const ctx = createContext(federation, req);
    const userObject = await cachedLookupObject(ctx, userId);

    if (!isActor(userObject)) {
        res.status(404);
        res.json({
            message: 'User not found.',
        });
        return;
    }

    let following: Collection | null = null;

    if (req.query.cursor && typeof req.query.cursor === 'string') {
        try {
            logger.debug`cursor is specified`;
            const cursor = req.query.cursor;
            const cursorId = base64url.default.decode(cursor);
            logger.debug`cursor decoded as ${cursorId}`;
            const followersObject = await cachedLookupObject(ctx, cursorId);

            if (followersObject instanceof Collection) {
                following = followersObject;
            }
        } catch {}
    } else {
        following = await userObject.getFollowing();
    }

    if (!following) {
        logger.error`user has no followers collection`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    let followingItems;
    
    try {
        followingItems = await readCollectionIds(ctx, following)
    } catch (error) {
        logger.error`error reading following collection: ${error}`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    const nextCursor = followingItems.next
        ? base64url.default.encode(followingItems.next.href)
        : undefined;

    const response: PaginatedList<string> = {
        items: followingItems.items.map(item => item.href),
        next: `/api/federation/users/${encodeURIComponent(userId)}/following?cursor=${nextCursor}`,
        count: following.totalItems ?? undefined,
    };
    res.json(response);
});

federationRouter.get('/users/:userId/likes', async (req, res) => {
    const userId = req.params.userId;
    logger.info`fetching user ${userId} likes`;

    const ctx = createContext(federation, req);
    const userObject = await cachedLookupObject(ctx, userId);

    if (!isActor(userObject)) {
        res.status(404);
        res.json({
            message: 'User not found.',
        });
        return;
    }

    let likes: Collection | null = null;

    if (req.query.cursor && typeof req.query.cursor === 'string') {
        try {
            logger.debug`cursor is specified`;
            const cursor = req.query.cursor;
            const cursorId = base64url.default.decode(cursor);
            logger.debug`cursor decoded as ${cursorId}`;
            const likesObject = await cachedLookupObject(ctx, cursorId);

            if (likesObject instanceof Collection) {
                likes = likesObject;
            }
        } catch {}
    } else {
        likes = await userObject.getLiked();
    }

    if (!likes) {
        const empty: PaginatedList<string> = {
            items: [],
            count: 0,
        };
        res.json(empty);
        return;
    }

    let likedItems;
    
    try {
        likedItems = await readCollectionIds(ctx, likes)
    } catch (error) {
        logger.error`error reading liked collection: ${error}`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    const nextCursor = likedItems.next
        ? base64url.default.encode(likedItems.next.href)
        : undefined;

    const response: PaginatedList<string> = {
        items: likedItems.items.map(item => item.href),
        next: `/api/federation/users/${encodeURIComponent(userId)}/likes?cursor=${nextCursor}`,
        count: likes.totalItems ?? undefined,
    };
    res.json(response);
});

type FederatedAttachment = {
    type: 'image' | 'video',
    name?: string,
    url: string,
};

type SupportedMediaType = 'text/plain' | 'text/html';

function normaliseMediaType(mediaType: string | null): SupportedMediaType {
    if (!mediaType || mediaType.toLowerCase() == 'text/html')
        return 'text/html';
    return 'text/plain'
}

type FederatedPost = {
    id: string,
    author: {
        id: string,
        handle: string,
        name: string,
    },
    content: string,
    contentMediaType: SupportedMediaType,
    attachment?: FederatedAttachment,
    // if this post is in reply to another post, this is its id
    isReplyTo?: string,
    // iso 8601 datetime
    createdAt?: string,
};

federationRouter.get('/posts/:postId', async (req, res) => {
    const postId = req.params.postId;
    logger.info`fetching post ${postId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, postId);

    logger.debug`fetched object: ${!!object}`;

    const post = await objectToPost(object);

    if (!post) {
        res.status(404);
        res.json({
            message: 'Post not found.',
        });
        return;
    }

    res.json(post);
});

federationRouter.get('/posts/:postId/likes', async (req, res) => {
    const postId = req.params.postId;
    logger.info`fetching post ${postId} likes`;

    const ctx = createContext(federation, req);
    const postObject = await cachedLookupObject(ctx, postId);

    if (!(postObject instanceof Note)) {
        res.status(404);
        res.json({
            message: 'Post not found.',
        });
        return;
    }

    let likes: Collection | null = null;

    if (req.query.cursor && typeof req.query.cursor === 'string') {
        try {
            logger.debug`cursor is specified`;
            const cursor = req.query.cursor;
            const cursorId = base64url.default.decode(cursor);
            logger.debug`cursor decoded as ${cursorId}`;
            const likesObject = await cachedLookupObject(ctx, cursorId);

            if (likesObject instanceof Collection) {
                likes = likesObject;
            }
        } catch {}
    } else {
        likes = await postObject.getLikes();
    }

    if (!likes) {
        const empty: PaginatedList<string> = {
            items: [],
            count: 0,
        };
        res.json(empty);
        return;
    }

    let likedItems;
    
    try {
        likedItems = await readCollectionIds(ctx, likes)
    } catch (error) {
        logger.error`error reading liked collection: ${error}`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    const nextCursor = likedItems.next
        ? base64url.default.encode(likedItems.next.href)
        : undefined;

    const response: PaginatedList<string> = {
        items: likedItems.items.map(item => item.href),
        next: `/api/federation/posts/${encodeURIComponent(postId)}/likes?cursor=${nextCursor}`,
        count: likes.totalItems ?? undefined,
    };
    res.json(response);
});

export default federationRouter;
