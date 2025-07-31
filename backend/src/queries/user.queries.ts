import { getDb } from "./client.ts";
import { type User, type UserKeyPair } from "../models/user.models.ts";

type MongoUser = Omit<User, 'username'> & { _id: string };

function userToMongoUser(user: User): MongoUser {
    return {
        _id: user.username,
        name: user.name,
        bio: user.bio,
        keySet: user.keySet,
        createdAt: user.createdAt,
    };
}

function mongoUserToUser(mongoUser: MongoUser): User {
    return {
        username: mongoUser._id,
        name: mongoUser.name,
        bio: mongoUser.bio,
        keySet: mongoUser.keySet,
        createdAt: mongoUser.createdAt,
    };
}

function collection() {
    const db = getDb();
    return db.collection<MongoUser>('users');
}

export async function findUserByUsername(username: string) {
    const users = collection();
    
    const mongoUser = await users.findOne({ _id: username });
    if (!mongoUser) return null;

    return mongoUserToUser(mongoUser);
}

export async function updateUserKeySet(username: string, keySet: UserKeyPair[]) {
    const users = collection();
    
    await users.updateOne({ _id: username }, {
        "$set": {
            keySet,
        }
    });
}

export async function createUser(user: User) {
    const users = collection();
    
    const inserted = await users.insertOne(userToMongoUser(user));
    return inserted.insertedId;
}
