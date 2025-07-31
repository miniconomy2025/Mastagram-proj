import { Router } from "express";
import { cachedLookupObject } from "../federation/lookup.ts";
import federation, { createContext } from "../federation/federation.ts";
import logger from "../logger.ts";
import { isActor } from "@fedify/fedify";

const userRouter = Router();

type FederatedUser = {
    id: string,
    handle: string,
    name: string,
    bio: string,
    // iso 8601 date time
    createdAt: string | null,
};

userRouter.get('/:actorId', async (req, res) => {
    logger.info`fetching user ${req.params.actorId}`;

    const ctx = createContext(federation, req);
    const object = await cachedLookupObject(ctx, req.params.actorId);

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

export default userRouter;
