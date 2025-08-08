import { Create, Endpoints, exportJwk, generateCryptoKeyPair, importJwk, Person, type Context, type Federation, type Recipient, type RequestContext } from "@fedify/fedify";
import { findUserByUsername, updateUser } from "../queries/user.queries.ts";
import type { User } from "../models/user.models.ts";
import { Temporal } from "@js-temporal/polyfill";
import logger from "../logger.ts";
import { federatedHostname, PAGINATION_LIMIT } from "./federation.ts";
import { countFollowersByUsername, findFollowersByUsername } from "../queries/follower.queries.ts";
import { countFollowingByUsername, findFollowingByUsername } from "../queries/following.queries.ts";
import { countPostsByAuthor, findPostsByAuthor } from "../queries/post.queries.ts";
import type { Post } from "../models/post.models.ts";
import type { WithId } from "mongodb";
import { postToNote } from "./post.dispatchers.ts";
import { convertActivityPubHandleToUrl } from "../utils/federation.util.ts";

async function userToPerson<T>(ctx: RequestContext<T>, user: User) {
    const url = ctx.getActorUri(user.username);
    const keys = await ctx.getActorKeyPairs(user.username);
    
    return new Person({
        id: url,
        preferredUsername: user.username,
        name: user.name,
        summary: user.bio,
        published: Temporal.Instant.fromEpochMilliseconds(user.createdAt),
        url: new URL(`${process.env.FRONTEND_URL}/profile/${user.username}@${federatedHostname}`),
        inbox: ctx.getInboxUri(user.username),
        outbox: ctx.getOutboxUri(user.username),
        followers: ctx.getFollowersUri(user.username),
        following: ctx.getFollowingUri(user.username),
        endpoints: new Endpoints({
            sharedInbox: ctx.getInboxUri(),
        }),
        publicKey: keys[0].cryptographicKey,
        assertionMethods: keys.map(key => key.multikey),
    });
}

export function postToCreate<T>(ctx: Context<T>, post: WithId<Post>) {
    const note = postToNote(ctx, post);

    return new Create({
        id: new URL(`${note.id}/activity`),
        actor: ctx.getActorUri(post.author),
        object: note,
        to: new URL("https://www.w3.org/ns/activitystreams#Public"),
    });
}

export function addUserDispatchers<T>(federation: Federation<T>) {
    federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
        var user = await findUserByUsername(identifier);

        logger.debug`GET users/${identifier}: ${user?.name}`;

        if (!user)
            return null;

        return userToPerson(ctx, user);
    }).setKeyPairsDispatcher(async (_ctx, identifier) => {
        const user = await findUserByUsername(identifier);

        if (!user) {
            logger.warn`Fetched key pairs for unknown user ${identifier}`;
            return [];
        }

        if (user.keySet.length > 0) {
            logger.debug`Fetched keys for user ${identifier}`;
            return await Promise.all(user.keySet.map(async keyPair => {
                return {
                    publicKey: await importJwk(JSON.parse(keyPair.publicKey), "public"),
                    privateKey: await importJwk(JSON.parse(keyPair.privateKey), "private"),
                };
            }));
        }

        const keyPairs = [];
        const userKeySet = [];

        for (const keyType of ["RSASSA-PKCS1-v1_5", "Ed25519"] as const) {
            const keyPair = await generateCryptoKeyPair(keyType);

            keyPairs.push(keyPair);

            const userKeyPair = {
                keyType,
                publicKey: JSON.stringify(await exportJwk(keyPair.publicKey)),
                privateKey: JSON.stringify(await exportJwk(keyPair.privateKey)),
            };

            userKeySet.push(userKeyPair);
        }

        await updateUser(identifier, {
            keySet: userKeySet,
        });

        logger.info`Generated user keys pair for user ${identifier}`;
        
        return keyPairs;
    });

    federation.setFollowersDispatcher("/users/{identifier}/followers", async (_ctx, identifier, cursorString) => {
        let cursor = parseInt(cursorString ?? '');
        if (!isFinite(cursor))
            cursor = Number.MAX_SAFE_INTEGER;

        const followers = await findFollowersByUsername(identifier, PAGINATION_LIMIT, cursor);
        logger.debug`GET users/${identifier}/followers: ${followers?.length} followers`;

        if (followers === null) return null;

        const recipients: Recipient[] = followers.map(follower => {
            return {
                id: new URL(follower.actor.id),
                inboxId: new URL(follower.actor.inboxUrl),
                endpoints: {
                    sharedInbox: follower.actor.sharedInboxUrl ? new URL(follower.actor.sharedInboxUrl) : null,
                },
            };
        });

        return {
            items: recipients,
            nextCursor: followers.length ? `${followers.at(-1)?.createdAt}` : null,
        };
    }).setFirstCursor(async () => {
        return '' + Number.MAX_SAFE_INTEGER;
    }).setCounter(async (_ctx, identifier) => {
        return await countFollowersByUsername(identifier);
    });

    federation.setFollowingDispatcher("/users/{identifier}/following", async (_ctx, identifier, cursorString) => {
        let cursor = parseInt(cursorString ?? '');
        if (!isFinite(cursor))
            cursor = Number.MAX_SAFE_INTEGER;

        const followings = await findFollowingByUsername(identifier, PAGINATION_LIMIT, cursor);
        logger.debug`GET users/${identifier}/following: ${followings?.length} following`;

        if (followings === null) return null;

        const recipients: URL[] = followings.map(follower => new URL(convertActivityPubHandleToUrl(follower.actorId)));

        return {
            items: recipients,
            nextCursor: followings.length ? `${followings.at(-1)?.createdAt}` : null,
        };
    }).setFirstCursor(async () => {
        return '' + Number.MAX_SAFE_INTEGER;
    }).setCounter(async (_ctx, identifier) => {
        return await countFollowingByUsername(identifier);
    });

    federation.setOutboxDispatcher("/users/{identifier}/outbox", async (ctx, identifier, cursorString) => {
        let cursor = parseInt(cursorString ?? '');
        if (!isFinite(cursor))
            cursor = Number.MAX_SAFE_INTEGER;

        const posts = await findPostsByAuthor(identifier, PAGINATION_LIMIT, cursor);
        logger.debug`GET users/${identifier}/outbox: ${posts?.length} posts`;

        if (posts === null) return null;

        const createActivities = posts.map(post => postToCreate(ctx, post));

        return {
            items: createActivities,
            nextCursor: posts.length ? `${posts.at(-1)?.createdAt}` : null,
        };
    }).setFirstCursor(async () => {
        return '' + Number.MAX_SAFE_INTEGER;
    }).setCounter(async (_ctx, identifier) => {
        return await countPostsByAuthor(identifier);
    });
}