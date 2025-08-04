import { Router } from "express";
import federation, { createContext, PAGINATION_LIMIT } from "../federation/federation.ts";
import logger from "../logger.ts";
import { cachedLookupObject } from "../federation/lookup.ts";
import { Collection, CollectionPage, Create, Document, Image, isActor, Link, type Actor, Note, Object, Video, type Context } from "@fedify/fedify";
import base64url from "base64url";
import { getFollowersAndFollowingCount, getRepliesCount } from "../utils/federation.util.ts";
import { getFollowers, getFollowing } from "../controllers/federation.controller.ts";
import { getCollectionItems } from "../services/federation.service.ts";

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

    const { followersCount, followingCount } = await getFollowersAndFollowingCount(
        object.followersId?.href ?? "",
        object.followingId?.href ?? ""
    );

    const user: FederatedUser = {
        id: object.id.href,
        handle: `@${object.preferredUsername}@${object.id.hostname}`,
        name: object.name as (string | null) ?? (object.preferredUsername as string),
        bio: object.summary as (string | null) ?? '',
        avatarUrl: iconUrl?.href,
        splashUrl: imageUrl?.href,
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
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

    const icon = await attribution.getIcon();
    const iconUrl = normaliseLink(icon?.url);

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

    let likesCount = undefined;
    try {
        likesCount = (await object.getLikes())?.totalItems ?? undefined;
    } catch { }

    let repliesCount = undefined;
    try {
        repliesCount = await getRepliesCount(object.repliesId?.href);
    } catch { }

    const post: FederatedPost = {
        id: object.id.href,
        author: {
            id: attribution.id.href,
            handle: `@${attribution.preferredUsername}@${attribution.id.hostname}`,
            name: attribution.name as (string | null) ?? (attribution.preferredUsername as string),
            avatar: iconUrl?.href,
        },
        content: object.content as string,
        contentMediaType: normaliseMediaType(object.mediaType),
        attachment,
        likesCount,
        repliesCount,
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
    followers: number;
    following: number;
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
        } catch { }
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
        next: nextCursor ? `/api/federation/users/${encodeURIComponent(req.params.userId)}/posts?cursor=${nextCursor}` : undefined,
        count: outbox.totalItems ?? undefined,
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
        } catch { }
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
        next: nextCursor && `/api/federation/users/${encodeURIComponent(userId)}/likes?cursor=${nextCursor}`,
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
        avatar?: string,
    },
    content: string,
    contentMediaType: SupportedMediaType,
    attachment?: FederatedAttachment,
    likesCount?: number,
    repliesCount?: number | unknown,
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

federationRouter.get('/posts/:postId/replies', async (req, res) => {
    const postId = req.params.postId;
    logger.info`fetching post ${postId}`;

    const ctx = createContext(federation, req);
    const postObject = await cachedLookupObject(ctx, postId);

    if (!(postObject instanceof Note)) {
        res.status(404);
        res.json({
            message: 'Post not found.',
        });
        return;
    }

    logger.debug`fetched object: ${!!postObject}`;

    let replies: Collection | null = null;

    if (req.query.cursor && typeof req.query.cursor === 'string') {
        try {
            logger.debug`cursor is specified`;
            const cursor = req.query.cursor;
            const cursorId = base64url.default.decode(cursor);
            logger.debug`cursor decoded as ${cursorId}`;
            const outboxObject = await cachedLookupObject(ctx, cursorId);

            if (outboxObject instanceof Collection) {
                replies = outboxObject;
            }
        } catch { }
    } else {
        replies = await postObject.getReplies();
    }

    if (!replies) {
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    let replyItems;

    try {
        replyItems = await readCollection(ctx, replies);
    } catch (error) {
        logger.error`error reading replies collection: ${error}`;
        res.status(500);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    const items = (await Promise.all(replyItems.items.map(item => objectToPost(item))))
        .filter(item => !!item);

    const nextCursor = replyItems.next
        ? base64url.default.encode(replyItems.next.href)
        : undefined;

    const replyPosts: PaginatedList<FederatedPost> = {
        items,
        next: `/api/federation/posts/${encodeURIComponent(postId)}/replies?cursor=${nextCursor}`,
        count: replies.totalItems ?? undefined,
    };

    res.json(replyPosts);
});

// Add this to your federationRouter.ts
federationRouter.get('/me/following/posts', async (req, res) => {
    try {
        const ctx = createContext(federation, req);
        const cursor = req.query.cursor?.toString();
        const limit = parseInt(req.query.limit?.toString() || PAGINATION_LIMIT.toString());

        // 1. Get the authenticated user's actor
        const actorUri = await cachedLookupObject(ctx, '@Third3King@mastodon.social');
        if (!actorUri) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // const currentUser = await cachedLookupObject(ctx, actorUri);
        if (!actorUri || !isActor(actorUri)) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Get the user's following collection
        const followingCollection = await cachedLookupObject(ctx, actorUri.followingId?.href ?? "") as Collection;
        if (!followingCollection) {
            return res.status(404).json({ error: "Following collection not found" });
        }

        // 3. Fetch all followed users
        const { items: following } = await getCollectionItems(
            ctx,
            followingCollection,
            cursor,
            async (item) => {
                if (!isActor(item)) return null;
                return item;
            }
        );

        // 4. Fetch posts from each followed user's outbox
        const allPosts: FederatedPost[] = [];
        const postPromises = following.map(async (followedUser) => {
            if (!followedUser) return;

            if (!isActor(followedUser) || !followedUser.id) {
                logger.warn(`Invalid followed user: ${followedUser}`);
                return;
            }
            try {
                const outbox = await followedUser.getOutbox();
                if (!outbox) return;

                const { items: outboxItems } = await readCollection(ctx, outbox);
                const createActivities = outboxItems.filter(item => item instanceof Create);

                for (const activity of createActivities) {
                    try {
                        const object = await activity.getObject();
                        if (!object || !(object instanceof Note)) continue;
                        
                        const post = await objectToPost(object);
                        if (post) allPosts.push(post);
                    } catch (error) {
                        logger.warn(`Failed to process post: ${error}`);
                    }
                }
            } catch (error) {
                logger.warn(`Failed to fetch outbox for ${followedUser.id}: ${error}`);
            }
        });

        await Promise.all(postPromises);

        // 5. Sort posts by date (newest first)
        allPosts.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        // 6. Apply pagination
        const paginatedPosts = cursor 
            ? allPosts.slice(parseInt(cursor), parseInt(cursor) + limit)
            : allPosts.slice(0, limit);

        // 7. Prepare response
        const nextCursor = allPosts.length > parseInt(cursor || '0') + limit 
            ? (parseInt(cursor || '0') + limit).toString() 
            : undefined;

        const response: PaginatedList<FederatedPost> = {
            items: paginatedPosts,
            next: nextCursor ? `/api/federation/me/following/posts?cursor=${nextCursor}&limit=${limit}` : undefined,
            count: allPosts.length,
        };

        return res.json(response);

    } catch (error) {
        logger.error(`Error fetching following posts: ${error}`);
        return res.status(500).json({ error: "Failed to fetch following posts" });
    }
});



federationRouter.get('/users/:userId/followers', getFollowers);

federationRouter.get('/users/:userId/following', getFollowing);

export default federationRouter;
