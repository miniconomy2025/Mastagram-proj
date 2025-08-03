import SeverSideEventsManager from '../configs/sever-side-events-manager.config.ts';
import type { Request, Response } from 'express';
import type { CommentModel, FollowModel, LikeModel } from '../types/interactions.js';
import { getCollection } from '../queries/client.ts';
import { getNotificationsForUser, updateReadStatus } from '../queries/feed.queries.ts';

export type NotificationType = 'like' | 'comment' | 'follow';
export interface Notification {
    type: NotificationType;
    targetId: string;
    userId: string;
    createdAt: Date;
    content?: string;
    read: boolean; 
}


export const notificationManager = new SeverSideEventsManager<Notification>();

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

    getNotifications = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.username;
        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }
        const notifications = await getNotificationsForUser(userId);
        res.json(notifications);
    }

    updateReadStatus = async (req: Request, res: Response): Promise<void> => {
        const notificationId = req.params.id;
        if (!notificationId) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }

        try {
            await updateReadStatus(notificationId, true);
            res.status(200).send();
        } catch (error) {
            res.status(500).json({ message: 'Failed to update notification status' });
        }
    }
}
