import { type FeedData } from "../controllers/feed.controller.ts";
import type { CommentModel, LikeModel } from "../types/interactions.js";
import { getCollection } from "./client.ts";
import { ObjectId } from "mongodb";
import type { Notification } from "../controllers/notifications.controller.ts";

function feedCollection() {
    return getCollection<FeedData>('feed');
}

function likesCollection() {
    return getCollection<LikeModel>('likes');
}

function commentsCollection() {
    return getCollection<CommentModel>('comments');
}

function notificationsCollection() {
    return getCollection<Notification>('notifications');
}

export async function findFeedDataByUserId(userId: string, limit: number): Promise<(FeedData & { likes: number; comments: number })[]> {
    const feeds = await feedCollection()
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

    return Promise.all(feeds.map(async (feed) => ({
        ...feed,
        likes: await likesCollection().countDocuments({ postId: feed.feedId }),
        comments: await commentsCollection().countDocuments({ postId: feed.feedId })
    })));
}

export async function findFeedDataByPostIds(postIds: string[]): Promise<(FeedData & { likes: number; comments: number })[]> {
    const feeds = await feedCollection()
        .find({ feedId: { $in: postIds } })
        .toArray();

    return Promise.all(feeds.map(async (feed) => ({
        ...feed,
        likes: await likesCollection().countDocuments({ postId: feed.feedId }),
        comments: await commentsCollection().countDocuments({ postId: feed.feedId })
    })));
}

export async function doesUserLikePost(username: string, postId: string) {
    const likes = await likesCollection();
    return !!(await likes.findOne({
        likedBy: username,
        postId,
    }));
}

export async function likePost(like: LikeModel) {
    await likesCollection().insertOne(like);
    await notificationsCollection().insertOne({
        type: 'like',
        targetId: like.postId,
        userId: like.likedBy,
        createdAt: like.likedAt,
        read: false,
    });
}

export async function unlikePost(userId: string, postId: string) {
    await likesCollection().deleteOne({ postId, likedBy: userId });
}

export async function commentOnPost(comment: CommentModel) {
    await commentsCollection().insertOne(comment);
    await notificationsCollection().insertOne({
        type: 'comment',
        targetId: comment.postId,
        userId: comment.commentedBy,
        content: comment.content,
        createdAt: comment.commentedAt,
        read: false,
    });
}

export async function updateReadStatus(notificationId: string, read: boolean) {
    await notificationsCollection().updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read } }
    );
}

export async function deleteComment(postId: string, commentId: string) {
    await commentsCollection().deleteOne({ _id: new ObjectId(commentId), postId });
}

export async function getUploaderId(postId: string): Promise<string | undefined> {
    const feed = await feedCollection().findOne({ feedId: postId });
    return feed?.author;
}

export async function saveFeedData(feedData: FeedData) {
    const feed = feedCollection();
    await feed.insertOne(feedData);
}

export async function getNotificationsForUser(userId: string) {
    return notificationsCollection().find({ userId }).sort({ createdAt: -1 }).toArray();
    
}
