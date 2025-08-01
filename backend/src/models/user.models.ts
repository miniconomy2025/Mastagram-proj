export type UserKeyPair = {
    keyType: string,
    publicKey: string,
    privateKey: string,
}

export type User = {
    username: string,
    email: string,
    googleId: string,
    name: string,
    bio: string,
    avatarUrl?: string,
    keySet: UserKeyPair[],
    createdAt: number, // unix milliseconds
};
