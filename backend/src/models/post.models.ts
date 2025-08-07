import type { Media } from "../controllers/feed.controller.ts";

export type Post = {
    author: string,
    content: string,
    createdAt: number, // unix milliseconds
    media?: Media[],
    feedId?: string,
    caption?: string,
    feedType?: 'image' | 'video',
};
