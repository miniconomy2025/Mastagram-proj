import type { MediaType } from "../types/s3.types.ts";
import { uploadToS3 } from "../utils/s3.utils.ts";
import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import redisClient from "../redis.ts";
import { parseCursor } from "../utils/pagination.ts";
import { commentOnPost, findFeedDataByPostIds, findFeedDataByUserId, getUploaderId, likePost, saveFeedData, unlikePost } from "../queries/feed.queries.ts";
import federation, { createContext } from "../federation/federation.ts";
import { Create, Like, Link, Note, Undo, Video, Image, type Recipient } from "@fedify/fedify";
import { ObjectId } from "mongodb";

interface CreateFeedData {
    caption?: string;
    hashtags?: string;
    feedType: 'media' | 'text';
    content?: string;
}

interface Media {
    url: string;
    mediaType: MediaType;
}

export interface FeedData{
    author: string;
    feedId: string;
    feedType: 'media' | 'text';
    caption?: string;
    hashtags?: string[];
    content?: string;
    media?: Media[];
    createdAt: Date;
}

interface FeedResponse {
    feedType: 'media' | 'text';
    successfulUploads?: Media[];
    failedUploads?: { filename: string; error: any }[];
}

const FEED_PAGE_LIMIT = 10;
const MY_POSTS_CACHE_TTL = 900; // 15 minutes

export class FeedController {
    constructor() {}
    
    uploadFeed = async (req: Request, res: Response): Promise<Response> => {
        const userId = req.user?.username;
        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }

        if (!req.body) {
            return res.status(400).json({
                message: 'Invalid request body'
            });
        }

        const { caption, hashtags, feedType, content }: CreateFeedData = req.body;
        const files = req.files as Express.Multer.File[] | undefined;

        if (feedType === 'media') {
            if (!files || files.length === 0) {
                return res.status(400).json({
                    error: {
                        message: 'Media files are required for media posts',
                    }
                });
            }
        } else if (feedType === 'text') {
            if (!content || content.trim() === '') {
                return res.status(400).json({
                    error: {
                        message: 'Content is required for text posts'
                    }
                });
            } if (content.length > 250) {
                return res.status(400).json({
                    error: {
                        message: 'Content exceeds maximum length of 250 characters'
                    }
                });
            }
        } else {
            return res.status(400).json({
                error: {
                    message: 'Invalid post type. Must be either "media" or "text"'
                }
            });
        }

        try {
            let media: Media[] = [];
            let failedUploads: Array<{ filename: string; error: any }> = [];
            if (feedType === 'media' && files && files.length > 0) {
                const uploadPromises = files.map(file => uploadToS3(file, userId, 'media'));
                const uploadResults = await Promise.allSettled(uploadPromises);

                uploadResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        const uploadResult = result.value;
                        if (uploadResult.success) {
                            media.push({
                                url: uploadResult.data!.url,
                                mediaType: uploadResult.data!.mediaType
                            });
                        } else {
                            failedUploads.push({
                                filename: files[index].originalname,
                                error: uploadResult.error
                            });
                        }
                    } else {
                        failedUploads.push({
                            filename: files[index].originalname,
                            error: result.reason
                        });
                    }
                });

                if (media.length === 0) {
                    return res.status(400).json({
                        error: {
                            message: 'All media uploads failed',
                            details: failedUploads
                        }
                    });
                }
            }

            const feedData: FeedData = {
                author: userId,
                feedId: new ObjectId().toString(),
                feedType,
                caption: caption?.trim(),
                hashtags: hashtags ? hashtags.trim().split(',').map(tag => tag.trim()) : [],
                createdAt: new Date()
            };

            if (feedType === 'media') {
                feedData.media = media;
            } else {
                feedData.content = content?.trim();
            }

            if ((feedData.media && feedData.media.length > 0) || feedData.content) {
                await saveFeedData(feedData);
                await redisClient.zadd(`feed:user:${userId}`, feedData.createdAt.getTime(), feedData.feedId);
                await redisClient.set(`post:${feedData.feedId}`, JSON.stringify(feedData), 'EX', 60 * 30);
                
                // Invalidate the user's my-posts cache
                await redisClient.del(`myposts:${userId}`);
            }

            const response: FeedResponse = {
                feedType,
            };

            if (feedType === 'media'){
                response.successfulUploads = media;
                response.failedUploads = failedUploads.length > 0 ? failedUploads : [];
            }

            const ctx = createContext(federation, req);

            const note = new Note({
                id: ctx.getObjectUri(Note, { identifier: feedData.feedId }),
                attribution: ctx.getActorUri(feedData.author),
                content: feedData.feedType === 'media' ? (feedData.caption ?? '') : (feedData.content ?? ''),
                attachments: feedData.media?.length
                    ? feedData.media.map(media =>
                        media.mediaType === 'image'
                            ? new Image({
                                url: new URL(media.url),
                                mediaType: 'image/jpeg',
                            })
                            : new Video({
                                url: new URL(media.url),
                                mediaType: 'video/mp4',
                            })
                    )
                    : undefined
            });


            await ctx.sendActivity(
                { username: feedData.author },
                "followers",
                new Create({
                    actor: ctx.getActorUri(feedData.author),
                    object: note,
                })
            );
    
            return res.status(201).json(response);

        } catch (error) {
            console.error('Error creating feed post:', error);
            return res.status(500).json({
                error: {
                    message: 'Failed to create feed post'
                }
            });
        }
    }

    getUserFeed = async (req: Request, res: Response): Promise<Response> => {
        const userId = req.user?.username;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const cursor = parseCursor(req.query.cursor as string);
        const feedKey = `feed:user:${userId}`;

        try {
            const postIds = await redisClient.zrevrangebyscore(feedKey, cursor, 0, 'LIMIT', 0, FEED_PAGE_LIMIT) as string[];

            const posts: FeedData[] = [];
            const missingPostIds: string[] = [];

            if (postIds.length > 0) {
                const cachedPosts = await redisClient.mget(postIds.map((id: string) => `post:${id}`));
                for (let i = 0; i < postIds.length; i++) {
                    const cached = cachedPosts[i];
                    if (cached) {
                        try {
                            posts.push(JSON.parse(cached));
                        } catch (parseError) {
                            console.error(`Error parsing cached post ${postIds[i]}:`, parseError);
                            missingPostIds.push(postIds[i]);
                        }
                    } else {
                        missingPostIds.push(postIds[i]);
                    }
                }
            }


            if (missingPostIds.length > 0) {
                const dbPosts = await findFeedDataByPostIds(missingPostIds);

                for (const post of dbPosts) {
                    posts.push(post);
                    await redisClient.set(`post:${post.feedId}`, JSON.stringify(post), 'EX', 1800);
                }
            }

            posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const nextCursor = posts.length > 0 ? new Date(posts[posts.length - 1].createdAt).getTime() : null;

            return res.json({
                posts,
                nextCursor
            });

        } catch (err) {
            console.error('Error fetching user feed:', err);
            return res.status(500).json({ message: "Failed to fetch feed" });
        }
    };
    
    // This method now uses caching.
    getMyPosts = async (req: Request, res: Response): Promise<Response> => {
        const userId = req.user?.username;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
    
        try {
            // 1. Check Redis for cached posts
            const cachedPosts = await redisClient.get(`myposts:${userId}`);
            if (cachedPosts) {
                console.log('✅ Redis HIT for getMyPosts', JSON.parse(cachedPosts));
                return res.json({ posts: JSON.parse(cachedPosts) });
            } else {
                console.log('❌ Redis MISS for getMyPosts, querying MongoDB');
            }

            const posts = await findFeedDataByUserId(userId, 50);
    
            if (posts.length > 0) {
                await redisClient.set(`myposts:${userId}`, JSON.stringify(posts), 'EX', MY_POSTS_CACHE_TTL);
            }
    
            return res.json({ posts });
        } catch (err) {
            console.error('Error fetching user posts:', err);
            return res.status(500).json({ message: "Failed to fetch user posts" });
        }
    };

    likePost = async (req: Request, res: Response): Promise<Response> => {
        const username = req.user?.username;
        if (!username) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }

        try {
            const ctx = createContext(federation, req);
            const postObject = await ctx.lookupObject(String(postId));

            if (!postObject || !postObject.attributionId) {
                return res.status(404).json({ message: "Post or its attribution not found" });
            }

            const senderActorId = ctx.getActorUri(username);
            if (!senderActorId) {
                return res.status(400).json({ message: "Invalid sender actor URI" });
            }

            const likeActivity = new Like({
                actor: senderActorId,
                object: postObject.id ?? postObject,
                to: postObject.attributionId,
            });

            const recipientActor = await ctx.lookupObject(postObject.attributionId);
            if (!recipientActor) {
                return res.status(400).json({ message: "Recipient actor is missing inbox information" });
            }

            await ctx.sendActivity({ username }, recipientActor as unknown as Recipient, likeActivity);

            return res.status(200).json({ message: "Post liked successfully" });

        } catch (error) {
            return res.status(500).json({ message: "Internal server error while liking post" });
        }
    };

    unlikePost = async (req: Request, res: Response): Promise<Response> => {
        const username = req.user?.username;
        if (!username) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }

        try {
            const ctx = createContext(federation, req);
            const postObject = await ctx.lookupObject(String(postId));
            if (!postObject || !postObject.attributionId) {
                return res.status(404).json({ message: "Post or its attribution not found" });
            }

            const recipientActor = await ctx.lookupObject(postObject.attributionId);
            if (!recipientActor) {
                return res.status(404).json({ message: "Recipient actor not found" });
            }

            const senderActorId = ctx.getActorUri(username);
            if (!senderActorId) {
                return res.status(400).json({ message: "Invalid sender actor URI" });
            }

            const likeActivity = new Like({
                actor: senderActorId,
                object: postObject.id ?? postObject,
                to: postObject.attributionId,
            });
            const undoActivity = new Undo({
                actor: senderActorId,
                object: likeActivity,
                to: postObject.attributionId,
            });
            await ctx.sendActivity(
                { username },
                recipientActor as unknown as Recipient,
                undoActivity
            );

            return res.status(200).json({ message: "Post unliked successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Failed to unlike post" });
        }
    }

    commentOnPost = async (req: Request, res: Response): Promise<Response> => {
        const username = req.user?.username;
        if (!username) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const postId = req.params.postId;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }

        const { content } = req.body;
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: "Comment content is required" });
        }

        try {
            const ctx = createContext(federation, req);
            const postObject = await ctx.lookupObject(String(postId));

            if (!postObject || !postObject.attributionId) {
                return res.status(404).json({ message: "Post or its attribution not found" });
            }

            const senderActorId = ctx.getActorUri(username);
            if (!senderActorId) {
                return res.status(400).json({ message: "Invalid sender actor URI" });
            }

            // const comment: Post = {
            //    author: senderActorId,
            //    content: content.trim(),
            //    createdAt: Date.now(),
            // };

            // const likeActivity = new Like({
            //     actor: postObject.attributionId,
            //     object: postObject.id ?? postObject,
            //     to: senderActorId,
            // });

            // const recipientActor = await ctx.lookupWebFinger(postObject.attributionId);
            // if (!recipientActor) {
            //     return res.status(400).json({ message: "Recipient actor is missing inbox information" });
            // }

            // await ctx.sendActivity({ username }, recipientActor as Recipient, likeActivity);

            return res.status(200).json({ message: "Post liked successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Failed to add comment" });
        }
    }
}