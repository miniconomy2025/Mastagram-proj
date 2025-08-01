import { Router } from "express";
import federation, { createContext } from "../federation/federation.ts";
import logger from "../logger.ts";
import { cachedLookupObject } from "../federation/lookup.ts";
import { isActor, Note } from "@fedify/fedify";

const federationRouter = Router();

type FederatedUser = {
    id: string,
    handle: string,
    name: string,
    bio: string,
    // iso 8601 date time
    createdAt: string | null,
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
    
    const user: FederatedUser = {
        id: object.id.href,
        handle: `@${object.preferredUsername}@${object.id.hostname}`,
        name: object.name as (string | null) ?? (object.preferredUsername as string),
        bio: object.summary as (string | null) ?? '',
        createdAt: object.published?.toString() ?? null,
    }

    res.json(user);
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

federationRouter.get('/notes/:noteId', async (req, res) => {
    const noteId = req.params.noteId;
    logger.info`fetching note ${noteId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, noteId);

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
