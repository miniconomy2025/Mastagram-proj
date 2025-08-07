import { getDb } from "./client.ts";
import { MongoError } from "mongodb";
import logger from "../logger.ts";
import type { Following } from "../models/follow.models.ts";

function collection() {
    const db = getDb();
    return db.collection<Following>('following');
}

export async function countFollowingByUsername(username: string) {
    const followers = collection();
    return await followers.countDocuments({
        followerUsername: username
    });
}

export async function findFollowingByUsername(username: string, limit: number, cursor: number = Number.MAX_SAFE_INTEGER): Promise<Following[] | null> {
    const following = collection();
    
    let userFollowing = await following.find({
        followerUsername: username,
        createdAt: {
            "$lt": cursor,
        },
    }).sort('createdAt', 'desc').limit(limit);

    return userFollowing.toArray();
}

export async function checkIfFollowing(followerUsername: string, followingActorId: string): Promise<boolean> {
    const followers = collection();
    const result = await followers.findOne({
      followingUsername: followerUsername,
      "actor.id": followingActorId, 
    });
  
    return !!result;
}

export async function createFollowing(following: Following) {
    const col = collection();
    
    try {
        await col.insertOne(following);
    } catch (error) {
        if (error instanceof MongoError && error.code === 11000) {
            return;
        } else {
            logger.error`failed to create following`;
            throw error;
        }
    }
}

export async function deleteFollowing(followingId: string, followerUsername: string) {
    const following = collection();
    await following.deleteOne({
        actorId: followingId,
        followerUsername,
    });
}
