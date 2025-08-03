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
        
    if (first) {
        return await readCollection(ctx, first);
    }
    
    const items: Object[] = [];

    for await (const item of await collection.getItems()) {
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

async function objectToPost(object: Object): Promise<FederatedPost | null> {
    const attribution = await (object?.getAttribution() ?? Promise.resolve(null));

    if (!(object instanceof Note) || !object.id || !object.content || !attribution?.id || !attribution.preferredUsername) {
        logger.warn`malformed post, ${object}`;
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
    raw: unknown,
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
        raw: await object.toJsonLd(),
    };

    res.json(user);
});

federationRouter.get('/users/:userId/posts', async (req, res) => {
    logger.info`fetching user ${req.params.userId} posts`;

    const ctx = createContext(federation, req);
    const userObject = await cachedLookupObject(ctx, req.params.userId);

    if (!userObject || !isActor(userObject) || !userObject.id || !isActor(userObject) || !userObject.preferredUsername) {
        logger.error`invalid user object, ${userObject}`;
        res.status(404);
        res.json({
            message: UNEXPECTED_ERROR,
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
        res.status(404);
        res.json({
            message: UNEXPECTED_ERROR,
        });
        return;
    }

    let outboxItems = await readCollection(ctx, outbox);

    const items = (await Promise.all(outboxItems.items.map(async item => {
        if (item instanceof Create) {
            const object = await item.getObject();
            if (object) {
                return await objectToPost(object);
            }
        }
        return null;
    }).filter(item => !!item))) as FederatedPost[];

    const nextCursor = outboxItems.next
        ? base64url.default.encode(outboxItems.next.href)
        : undefined;

    const response: PaginatedList<FederatedPost> = {
        items,
        next: `/api/federation/users/${req.params.userId}/posts?cursor=${nextCursor}`,
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

    const post = object ? await objectToPost(object) : null;

    if (!post) {
        res.status(404);
        res.json({
            message: 'Post not found.',
        });
        return;
    }

    res.json(post);
});

export default federationRouter;
