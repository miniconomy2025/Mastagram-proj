import { getDb } from "./client.ts";
import { type User } from "../models/user.models.ts";
import type { FederatedUser } from "../types/federation.types.ts";
import logger from "../logger.ts";
import { updateUserInElasticsearch } from "../utils/elasticsearch.util.ts";
import federation, { createContext } from "../federation/federation.ts";

type MongoUser = Omit<User, 'username'> & { _id: string };

function userToMongoUser(user: User): MongoUser {
    return {
        _id: user.username,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        bio: user.bio,
        keySet: user.keySet,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
    };
}

function mongoUserToUser(mongoUser: MongoUser): User {
    return {
        username: mongoUser._id,
        googleId: mongoUser.googleId,
        email: mongoUser.email,
        name: mongoUser.name,
        bio: mongoUser.bio,
        keySet: mongoUser.keySet,
        createdAt: mongoUser.createdAt,
        avatarUrl: mongoUser.avatarUrl,
    };
}

function collection() {
    const db = getDb();
    return db.collection<MongoUser>('users');
}

export async function findUserByGoogleId(googleId: string) {
    const users = collection();
    
    const mongoUser = await users.findOne({ googleId });
    if (!mongoUser) return null;

    return mongoUserToUser(mongoUser);
}

export async function findUserByUsername(username: string) {
    const users = collection();
    
    const mongoUser = await users.findOne({ _id: username });
    if (!mongoUser) return null;

    return mongoUserToUser(mongoUser);
}

export async function updateUser(username: string, delta: Partial<Omit<User, 'username'>>) {
    const users = collection();
    
    const user = await users.findOneAndUpdate({ _id: username }, {
        "$set": delta,
    }, {
        returnDocument: "after",
    });

    if (!user) {
        return null;
    }

    const updatedUser = mongoUserToUser(user);

    try {
        const esUpdate: Partial<FederatedUser> = {};
        
        if (delta.name) esUpdate.name = delta.name;
        if (delta.bio) esUpdate.bio = delta.bio;
        if (delta.avatarUrl) esUpdate.avatarUrl = delta.avatarUrl;
        

        if (Object.keys(esUpdate).length > 0) {
            const ctx = createContext(federation);
            const userUri = ctx.getActorUri(username).href;
            
            await updateUserInElasticsearch(userUri, esUpdate);
            
            logger.info`Successfully updated Elasticsearch record for user ${username}`;
        }
    } catch (error) {
        logger.error`Failed to update Elasticsearch record for user ${username}: ${error}`;
    }

    return updatedUser;
}

export async function createUser(user: User) {
    const users = collection();
    await users.insertOne(userToMongoUser(user));
}
