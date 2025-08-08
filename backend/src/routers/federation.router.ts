import { Router } from "express";
import federation, { createContext, federatedHostname, PAGINATION_LIMIT } from "../federation/federation.ts";
import logger from "../logger.ts";
import { cachedLookupObject } from "../federation/lookup.ts";
import { Collection, CollectionPage, Create, Document, Image, isActor, Link, type Actor, Note, Object, Video, type Context } from "@fedify/fedify";
import base64url from "base64url";
import { getFollowersAndFollowingCount, getRepliesCount } from "../utils/federation.util.ts";
import { getFollowers, getFollowing } from "../controllers/federation.controller.ts";
import { esClient } from "../configs/elasticsearch.ts";
import { ensureAuthenticated, maybeAuthenticated } from "../configs/passport.config.ts";
import { Temporal } from "@js-temporal/polyfill";
import { checkIfFollowing } from "../queries/following.queries.ts";
import { doesUserLikePost } from "../queries/feed.queries.ts";

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

async function readEntireCollection(ctx: Context<unknown>, collection: Collection | CollectionPage): Promise<Object[]> {
    let page = await readCollection(ctx, collection);
    const returnItems = page.items;

    while (page.next) {
        const nextPage = await cachedLookupObject(ctx, page.next.href);
        if (!nextPage || !(nextPage instanceof Collection)) break;

        page = await readCollection(ctx, nextPage);
        for (const item of page.items) {
            returnItems.push(item);
        }
    }

    return returnItems;
}

async function readCollection(ctx: Context<unknown>, collection: Collection | CollectionPage): Promise<{ items: Object[], next?: URL }> {
    const first = await collection.getFirst();

    if (first)
        return await readCollection(ctx, first);

    const items = [];
    
    try {
        for await (const item of collection.getItems()) {
            if (item instanceof Object) {
                items.push(item);
            } else if (item.href) {
                try {
                    const obj = await cachedLookupObject(ctx, item.href.href);
                    if (obj)
                        items.push(obj);
                } catch {}
            }
        }
    } catch {} // return what we have

    const next = collection instanceof CollectionPage ? collection.nextId : null;

    return {
        items,
        next: next ?? undefined,
    };
}

async function objectToUser(object: unknown, myUsername?: string): Promise<FederatedUser | null> {
    if (!isActor(object) || !object.id || !object.preferredUsername) {
        return null;
    }

    // Start all async calls in parallel
    const [icon, image, followerStats] = await Promise.all([
        object.getIcon(),
        object.getImage(),
        getFollowersAndFollowingCount(
            object.followersId?.href ?? "",
            object.followingId?.href ?? ""
        )
    ]);

    const iconUrl = normaliseLink(icon?.url);
    const imageUrl = normaliseLink(image?.url);
    const { followersCount, followingCount } = followerStats;

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
        followedByMe: !!myUsername && await checkIfFollowing(myUsername, object.id.href),
    };

    return user;
}


async function objectToPost(ctx: Context<unknown>, object: unknown, myUsername?: string): Promise<FederatedPost | null> {
    if (!(object instanceof Note) || !object.id || !object.content) {
        logger.warn`malformed post, ${object && typeof object === 'object' && 'id' in object ? object.id : 'no object id'}`;
        return null;
    }

    const attribution = await object?.getAttribution();

    if (!attribution?.id || !attribution.preferredUsername) {
        logger.warn`malformed post attribution, ${attribution?.id}`;
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
        likedByMe: !!myUsername && await doesUserLikePost(ctx.getActorUri(myUsername).href, object.id.href),
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
    followedByMe: boolean,
};

federationRouter.get('/users/:userId', maybeAuthenticated, async (req, res) => {
    logger.info`fetching user ${req.params.userId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, req.params.userId);

    const user = await objectToUser(object, req.user?.username);

    if (!user) {
        res.status(404);
        res.json({
            message: 'User not found.',
        });
        return;
    }

    let followedByMe = !!req.user?.username && await checkIfFollowing(req.user.username, user.id);

    const response = {
        ...user,
        followedByMe,
    };

    res.json(response);
});

federationRouter.get('/users/:userId/posts', maybeAuthenticated, async (req, res) => {
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
                return await objectToPost(ctx, object, req.user?.username);
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
    likedByMe: boolean,
};

federationRouter.get('/posts/:postId', maybeAuthenticated, async (req, res) => {
    const postId = req.params.postId;
    logger.info`fetching post ${postId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, postId);

    logger.debug`fetched object: ${!!object}`;

    const post = await objectToPost(ctx, object, req.user?.username);

    if (!post) {
        res.status(404);
        res.json({
            message: 'Post not found.',
        });
        return;
    }

    res.json(post);
});

federationRouter.get('/posts/:postId/replies', maybeAuthenticated, async (req, res) => {
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

    const items = (await Promise.all(replyItems.items.map(item => objectToPost(ctx, item, req.user?.username))))
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

type FeedReader = {
    items: {
        post: FederatedPost,
        published: Temporal.Instant
    }[],
    next?: string,
    current?: string,
};

async function expandFeed(ctx: Context<unknown>, feed: FeedReader, username: string, cursor: Temporal.Instant) {
    try {
        if (!feed.next)
            return;

        const outbox = await cachedLookupObject(ctx, feed.next);
        if (!outbox || !(outbox instanceof Collection))
            return;
        
        const nextPage = await readCollection(ctx, outbox);
        
        const posts = (await Promise.all(nextPage.items.map(async item => {
            if (!(item instanceof Create) || !item.objectId)
                return null;

            const object = await cachedLookupObject(ctx, item.objectId.href);
            if (!object)
                return null;

            const post = await objectToPost(ctx, object, username);
            if (!post || !item.published)
                return null;
            return {
                post,
                published: item.published,
            };
        })))
            .filter(post => !!post)
            .filter(post => {
                const keep = Temporal.Instant.compare(post.published, cursor) < 0;
                if (!keep)
                    logger.error`removing too recent post, created ${post.published} (${post.post.id})`;
                return keep;
            });

        logger.info`read ${posts.length} posts`;

        feed.current = feed.next;
        feed.items = posts;
        feed.next = nextPage.next?.href;
        return;
    } catch {
        feed.next = undefined;
        feed.items = [];
        return;
    }
}

federationRouter.get('/me/following/posts', ensureAuthenticated, async (req, res) => {
    const username = req.user?.username;
    
    if (!username) {
        return res.status(401).json({error: 'Not logged in!'});
    }

    const userHandle = `@${username}@${federatedHostname}`;

    let cursor = Temporal.Now.instant();
    try {
        let cursorEpoch = parseInt(req.query.cursor as string | undefined ?? '');
        if (isFinite(cursorEpoch)) {
            cursor = Temporal.Instant.fromEpochMilliseconds(cursorEpoch);
        }
    } catch {}
    
    const ctx = createContext(federation, req);

    const limit = parseInt(req.query.limit?.toString() || PAGINATION_LIMIT.toString());

    const actor = await cachedLookupObject(ctx, userHandle);
    if (!actor || !isActor(actor)) {
        throw new Error('Logged in user does not exist');
    }

    const followingCollection = await actor.getFollowing();
    if (!followingCollection) {
        throw new Error('Malformed user.');
    }

    const followingActors = (await readEntireCollection(
        ctx,
        followingCollection,
    )).filter(object => isActor(object));

    const followingFeedReaders: FeedReader[] = (await Promise.all(
        followingActors.map(async actor => {
            if (!actor.outboxId) return null;

            return {
                items: [] as { post: FederatedPost, published: Temporal.Instant }[],
                next: actor.outboxId.href,
                current: '',
            };
        }
    ))).filter(feed => feed != null);

    const followingFeeds = await Promise.all(followingFeedReaders.map(feed => {
        expandFeed(ctx, feed, username, cursor);
        return feed;
    }));

    logger.info`user is following ${followingFeeds.length} users`;

    const feed = [];

    // continue while we haven't filled up the feed and all feeds are not exhausted
    while (feed.length < limit && !followingFeeds.every(f => !f.next)) {
        // find newest post
        let newest = undefined;
        let newestFeed = undefined;

        for (const followingFeed of followingFeeds) {
            // extend feed if empty
            while (followingFeed.items.length === 0 && followingFeed.next) {
                await expandFeed(ctx, followingFeed, username, cursor);
            }

            for (const post of followingFeed.items) {
                if (!newest || Temporal.Instant.compare(newest.published, post.published) < 0) {
                    newest = post;
                    newestFeed = followingFeed;
                }
            }
        }

        if (!newest || !newestFeed) break;

        feed.push(newest);
        newestFeed.items = newestFeed.items.filter(item => item != newest);
    }

    const nextCursor = feed.at(-1)?.published?.epochMilliseconds;

    const response: PaginatedList<FederatedPost> = {
        items: feed.map(item => item.post),
        next: nextCursor ? `/api/federation/me/following/posts?cursor=${nextCursor}&limit=${limit}` : undefined,
    };

    return res.json(response);
});


federationRouter.get('/search', maybeAuthenticated, async (req, res) => {
    try {
        const { q, type, cursor, limit = 20 } = req.query;
        const ctx = createContext(federation, req);

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: "Query parameter 'q' is required" });
        }

        const searchType = type === 'user' ? 'user' :
            type === 'post' ? 'post' :
                'both';

        let results: (FederatedUser | FederatedPost)[] = [];
        let nextCursor: string | undefined;

        // 1. Exact handle lookup (only if searching users or both, and q starts with @)
        if ((searchType === 'user' || searchType === 'both') && q.startsWith('@')) {
            try {
                const handleParts = q.slice(1).split('@');
                const username = handleParts[0];
                const domain = handleParts[1] || "";
                const actorUrl = `https://${domain}/users/${username}`;

                const actor = await cachedLookupObject(ctx, actorUrl);
                const user = await objectToUser(actor, req.user?.username);
                if (user) {
                    results.push(user);
                }
            } catch (error) {
                logger.warn(`User lookup failed for ${q}: ${error}`);
            }
        }

        if (searchType === 'user' || searchType === 'both') {
            const userSearchRes = await esClient.search({
                index: 'federated-users',
                from: cursor ? parseInt(cursor as string) : 0,
                size: parseInt(limit as string),
                query: {
                    multi_match: {
                        query: q,
                        fields: ['name', 'handle'],
                        fuzziness: 'AUTO',
                    },
                },
            });

            const hits = userSearchRes.hits.hits;
            const users = hits.map(hit => hit._source) as FederatedUser[];

            results = results.concat(users);
        }

        if (searchType === 'post' || searchType === 'both') {
            const postSearchRes = await esClient.search({
                index: 'federated-posts',
                from: cursor ? parseInt(cursor as string) : 0,
                size: parseInt(limit as string),
                query: {
                    match: {
                        content: {
                            query: q,
                            fuzziness: "AUTO",
                            operator: 'and'
                        }
                    }
                }

            });

            const hits = postSearchRes.hits.hits;
            const posts = hits.map(hit => hit._source) as FederatedPost[];

            results = results.concat(posts);
        }

        const totalHits = results.length;

        if (results.length === parseInt(limit as string)) {
            const newCursor = cursor ? parseInt(cursor as string) + parseInt(limit as string) : parseInt(limit as string);
            nextCursor = newCursor.toString();
        }

        // Separate results by type
        const users = results.filter(r => 'handle' in r) as FederatedUser[];
        const posts = results.filter(r => 'content' in r) as FederatedPost[];

        return res.json({
            users,
            posts,
            next: nextCursor ? `/api/federation/search?q=${encodeURIComponent(q)}&type=${searchType}&cursor=${nextCursor}&limit=${limit}` : undefined,
            count: totalHits,
        });

    } catch (error) {
        logger.error(`Search failed: ${error}`);
        return res.status(500).json({ error: "Search failed" });
    }
});

federationRouter.get('/posts/:postId/with-replies', maybeAuthenticated, async (req, res) => {
    const postId = req.params.postId;
    logger.info`fetching post with replies ${postId}`;

    const ctx = createContext(federation, req);
    
    try {
        const postObject = await cachedLookupObject(ctx, postId);
        
        if (!(postObject instanceof Note)) {
            res.status(404).json({ message: 'Post not found.' });
            return;
        }


        const post = await objectToPost(ctx, postObject, req.user?.username);
        if (!post) {
            res.status(404).json({ message: 'Post not found.' });
            return;
        }

        let replies: Collection | null = null;
        if (req.query.cursor && typeof req.query.cursor === 'string') {
            try {
                const cursorId = base64url.default.decode(req.query.cursor);
                const outboxObject = await cachedLookupObject(ctx, cursorId);
                if (outboxObject instanceof Collection) {
                    replies = outboxObject;
                }
            } catch (error) {
                logger.warn`Error decoding cursor: ${error}`;
            }
        } else {
            replies = await postObject.getReplies();
        }

        let replyItems: FederatedPost[] = [];
        let nextCursor: string | undefined;
        
        if (replies) {
            try {
                const replyCollection = await readCollection(ctx, replies);
                replyItems = (await Promise.all(
                    replyCollection.items.map(item => objectToPost(ctx, item, req.user?.username))
                )).filter((item): item is FederatedPost => item !== null);
                
                nextCursor = replyCollection.next 
                    ? base64url.default.encode(replyCollection.next.href)
                    : undefined;
            } catch (error) {
                logger.error`Error processing replies: ${error}`;
            }
        }

        res.json({
            post,
            replies: {
                items: replyItems,
                next: nextCursor ? `/api/federation/posts/${encodeURIComponent(postId)}/with-replies?cursor=${nextCursor}` : undefined,
                count: replies?.totalItems ?? replyItems.length,
            }
        });

    } catch (error) {
        logger.error`Error fetching post with replies: ${error}`;
        res.status(500).json({ message: UNEXPECTED_ERROR });
    }
});


federationRouter.get('/users/:userId/followers', maybeAuthenticated, getFollowers);

federationRouter.get('/users/:userId/following', maybeAuthenticated, getFollowing);

export default federationRouter;
