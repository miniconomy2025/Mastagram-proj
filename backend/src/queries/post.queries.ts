import { getDb } from "./client.ts";
import type { Post } from "../models/post.models.ts";
import { ObjectId } from "mongodb";

function collection() {
    const db = getDb();
    return db.collection<Post>('posts');
}

export async function findPostById(postId: string) {
    const posts = collection();
    
    const post = await posts.findOne(new ObjectId(postId));
    return post;
}

export async function findPostsByAuthor(username: string, limit: number, cursor: number = 0) {
    const posts = collection();
    
    const userPosts = await posts
        .find({
            author: username,
            createdAt: {
                "$lt": cursor
            },
        })
        .limit(limit);
    if (!userPosts) return null;

    return userPosts.toArray();
}

export async function createPost(post: Post) {
    const posts = collection();
    
    const inserted = await posts.insertOne(post);
    return inserted.insertedId;
}
