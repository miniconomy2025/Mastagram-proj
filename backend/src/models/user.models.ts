export type UserKeyPair = {
    keyType: string,
    publicKey: string,
    privateKey: string,
}

export type User = {
    username: string,
    name: string,
    bio: string,
    keySet: UserKeyPair[],
    createdAt: number, // unix milliseconds
};
