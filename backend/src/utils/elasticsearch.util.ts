import { esClient } from "../configs/elasticsearch.ts";
import logger from "../logger.ts";
import type { FederatedUser } from "../types/federation.types.ts";

export async function indexUserInElasticsearch(user: FederatedUser): Promise<void> {
    try {
        await esClient.index({
            index: 'federated-users',
            id: user.id, 
            document: {
                id: user.id,
                handle: user.handle,
                name: user.name,
                bio: user.bio,
                avatarUrl: user?.avatarUrl,
                followersUri: user.followersUri,
                followingUri: user.followingUri,
                createdAt: user.createdAt,
            },
            refresh: true 
        });
        logger.info`Successfully indexed user ${user.handle} in Elasticsearch`;
    } catch (error) {
        logger.error`Failed to index user ${user.handle}: ${error}`;
        throw error;
    }
}

export async function updateUserInElasticsearch(userId: string, updates: Partial<FederatedUser>): Promise<void> {
    try {
        await esClient.update({
            index: 'federated-users',
            id: userId,
            doc: updates
        });
        logger.info`Successfully updated user ${userId} in Elasticsearch`;
    } catch (error) {
        logger.error`Failed to update user ${userId}: ${error}`;
        throw error;
    }
}