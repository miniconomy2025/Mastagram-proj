import { getDb } from "./client.ts";
import { type User, type UserKeyPair } from "../models/user.models.ts";

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

    if (!user)
        return user;

    return mongoUserToUser(user);
}

export async function createUser(user: User) {
    const users = collection();
    await users.insertOne(userToMongoUser(user));
}
