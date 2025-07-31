import { Router } from "express";
import { cachedLookupObject } from "../federation/lookup.ts";
import federation, { createContext } from "../federation/federation.ts";
import logger from "../logger.ts";
import { Note } from "@fedify/fedify";

const postRouter = Router();

type FederatedPost = {
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

postRouter.get('/:noteId', async (req, res) => {
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
    
    const post: FederatedPost = {
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

export default postRouter;
