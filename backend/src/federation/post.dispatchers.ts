import { Note, PUBLIC_COLLECTION, type Context, type Federation } from "@fedify/fedify";
import { findPostById } from "../queries/post.queries.ts";
import type { WithId } from "mongodb";
import type { Post } from "../models/post.models.ts";
import { Temporal } from "@js-temporal/polyfill";

export function postToNote<T>(ctx: Context<T>, post: WithId<Post>) {
    const url = ctx.getObjectUri(Note, { identifier: post._id.toString() });
    
    return new Note({
        id: url,
        attribution: ctx.getActorUri(post.author),
        to: PUBLIC_COLLECTION,
        cc: ctx.getFollowersUri(post.author),
        content: post.content,
        mediaType: 'text/html',
        published: Temporal.Instant.fromEpochMilliseconds(post.createdAt),
        url: url,
    });
}

export function addPostDispatchers<T>(federation: Federation<T>) {
    federation.setObjectDispatcher(
        Note,
        "/posts/{identifier}",
        async (ctx, values) => {
            const identifer = values.identifier;
            
            const post = await findPostById(identifer);
            if (!post) return null;

            return postToNote(ctx, post);
        },
    )
}
