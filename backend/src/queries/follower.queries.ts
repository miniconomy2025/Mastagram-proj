import { getDb } from "./client.ts";
import { MongoError } from "mongodb";
import logger from "../logger.ts";
import type { Follower } from "../models/follow.models.ts";

function collection() {
    const db = getDb();
    return db.collection<Follower>('followers');
}

export async function findFollowersByUsername(username: string, limit: number, cursor: number = Number.MAX_SAFE_INTEGER): Promise<Follower[] | null> {
    const followers = collection();

    let userFollowers = await followers.find({
        followingUsername: username,
        createdAt: {
            "$lt": cursor,
        },
    }).sort('createdAt', 'desc').limit(limit);

    if (!userFollowers) return null;

    return userFollowers.toArray();
}

export async function createFollower(follower: Follower) {
    const followers = collection();
    
    try {
        await followers.insertOne(follower);
    } catch (error) {
        if (error instanceof MongoError && error.code === 11000) {
            return;
        } else {
            logger.error`failed to create follower`;
            throw error;
        }
    }
}

export async function deleteFollower(followerId: string, followingUsername: string) {
    const followers = collection();
    await followers.deleteOne({
        "actor.id": followerId,
        followingUsername,
    });
}
