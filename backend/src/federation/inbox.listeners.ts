import { Accept, Add, Announce, Block, Create, Delete, Follow, Like, Reject, Remove, Undo, Update, type Federation } from "@fedify/fedify";
import logger from "../logger.ts";
import { Temporal } from "@js-temporal/polyfill";
import { createFollower, deleteFollower } from "../queries/follower.queries.ts";

function unimplemented<T>(message?: T) {
    if (message != null)
        logger.error`unimplemented: ${message}`;
    else
        logger.error`unimplemented`;
    // throw new Error(`unimplemented`);
}

export function addInboxListeners<T>(federation: Federation<T>) {
    federation.setInboxListeners("/users/{identifier}/inbox", "/inbox")
        .on(Follow, async (ctx, follow) => {
            logger.debug`Follow activity received ${follow}`;
            
            if (follow.actorId == null || follow.objectId == null) {
                logger.error`Invalid Follow, actor or object is null`;
                return;
            }

            const follower = await follow.getActor();
            if (!follower || !follower.id || !follower.inboxId || !follower.endpoints || !follower.endpoints.sharedInbox) {
                logger.error`Invalid Follow, invalid actor`;
                return;
            }

            const parsedObjectId = ctx.parseUri(follow.objectId);
            if (parsedObjectId?.type !== 'actor') {
                logger.error`Invalid Follow, object is not an actor`;
                return;
            }

            await createFollower({
                actor: {
                    id: follower.id.href,
                    inboxUrl: follower.inboxId.href,
                    sharedInboxUrl: follower.endpoints?.sharedInbox?.href,
                },
                followingUsername: parsedObjectId.identifier,
                createdAt: Temporal.Now.instant().epochMilliseconds,
            });

            await ctx.sendActivity(
                parsedObjectId,
                follower,
                new Accept({
                    actor: follow.objectId,
                    to: follow.actorId,
                    object: follow,
                })
            );

            logger.info`Accepted follower ${follow.actorId.href}`;
        })
        .on(Accept, async (_ctx, accept) => unimplemented(accept))
        .on(Reject, async (_ctx, reject) => unimplemented(reject))
        .on(Create, async (_ctx, create) => unimplemented(create))
        .on(Update, async (_ctx, update) => unimplemented(update))
        .on(Delete, async (_ctx, del) => unimplemented(del))
        .on(Add, async (_ctx, add) => unimplemented(add))
        .on(Remove, async (_ctx, remove) => unimplemented(remove))
        .on(Like, async (_ctx, like) => unimplemented(like))
        .on(Announce, async (_ctx, announce) => unimplemented(announce))
        .on(Block, async (_ctx, block) => unimplemented(block))
        .on(Undo, async (ctx, undo) => {
            const object = await undo.getObject();

            logger.debug`Undo activity received ${undo}`;

            if (object instanceof Follow) {
                if (undo.actorId == null || object.objectId == null) return;
                
                const parsedObject = ctx.parseUri(object.objectId);
                if (parsedObject == null || parsedObject.type !== 'actor') return;

                await deleteFollower(undo.actorId.href, parsedObject.identifier);
    
                logger.info`Removed follower ${undo.actorId}`;
            } else {
                unimplemented(object);
            }
        });
}