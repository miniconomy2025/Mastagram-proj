import { getDb } from "./client.ts";
import type { Post } from "../models/post.models.ts";
import { ObjectId } from "mongodb";

function collection() {
    const db = getDb();
    return db.collection<Post>('feed');
}

export async function findPostById(postId: string) {
    const posts = collection();
    
    const post = await posts.findOne(new ObjectId(postId));
    return post;
}

export async function countPostsByAuthor(username: string) {
    const posts = collection();
    
    return await posts.countDocuments({
        author: username,
    });;
}

export async function findPostsByAuthor(username: string, limit: number, cursor: number = Number.MAX_SAFE_INTEGER) {
    const posts = collection();
    
    const userPosts = await posts.find({
        author: username,
        createdAt: {
            "$lt": cursor
        },
    }).sort('createdAt', 'desc').limit(limit);

    return userPosts.toArray();
}

export async function createPost(post: Post) {
    const posts = collection();
    
    const inserted = await posts.insertOne(post);
    return inserted.insertedId;
}
