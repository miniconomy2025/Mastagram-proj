import { FeedQueries } from "../queries/feed.queries.ts";
import type { MediaType } from "../types/s3.types.ts";
import { uploadToS3 } from "../utils/s3.utils.ts";
import type { Request, Response } from "express";
import { randomUUID } from "crypto";

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
    userId: string;
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

export class FeedController {
    feedQueries: FeedQueries;
    constructor() {
        this.feedQueries = new FeedQueries();
    }
    
    uploadFeed = async (req: Request, res: Response): Promise<Response> => {
        const userId = req.user?.username?.toString();
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
                userId,
                feedId: randomUUID().toString(),
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
                await this.feedQueries.saveFeedData(feedData);
            } else {
                // If no media or content, we don't create an empty post
            }

            const response: FeedResponse = {
                feedType,
            };

            if (feedType === 'media'){
                response.successfulUploads = media;
                response.failedUploads = failedUploads.length > 0 ? failedUploads : [];
            }

            return res.status(201).json(response);

        } catch (error) {
            return res.status(500).json({
                error: {
                    message: 'Failed to create feed post'
                }
            });
        }
    }
}