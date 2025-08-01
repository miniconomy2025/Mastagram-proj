import { type FeedData } from "../controllers/feed.controller.ts";
import { getCollection } from "./client.ts";

function collection() {
    return getCollection<FeedData>('feed');
}

export async function findFeedDataByUserId(userId: string, limit: number) {
    const feeds = collection();
    return feeds.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
}

export async function findFeedDataByPostIds(postIds: string[]) {
    const feeds = collection();
    return feeds.find({
        feedId: { $in: postIds }
    }).toArray();
}

export async function saveFeedData(feedData: FeedData) {
    const feed = collection();
    await feed.insertOne(feedData);
}
