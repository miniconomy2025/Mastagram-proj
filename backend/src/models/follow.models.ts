export type Actor = {
    id: string,
    inboxUrl: string,
    sharedInboxUrl?: string,
};

export type Follower = {
    actor: Actor,
    followingUsername: string,
    createdAt: number, // unix milliseconds
};

export type Following = {
    followerUsername: string,
    actorId: string,
    createdAt: number, // unix milliseconds
}
