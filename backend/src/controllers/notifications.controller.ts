import SeverSideEventsManager from '../configs/sever-side-events-manager.config.ts';
import type { Request, Response } from 'express';
import type { CommentModel, FollowModel, LikeModel } from '../types/interactions.js';

export type LikeNotification = LikeModel & {
    type: 'like';
}

export type FollowNotification = FollowModel & {
    type: 'follow';
}

export type CommentNotification = CommentModel & {
    type: 'comment';
}


export type InteractionsModel = LikeNotification | FollowNotification | CommentNotification;


export const notificationManager = new SeverSideEventsManager<InteractionsModel>();

export class NotificationController {
    subscribe = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.username;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        notificationManager.addClient(userId, res);

        req.on('close', () => {
            notificationManager.removeClient(userId);
            res.end();
        });
    };

    unsubscribe = (req: Request, res: Response): void => {
        const userId = req.user?.username;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }

        notificationManager.removeClient(userId);
        res.status(204).send();
    }
}
