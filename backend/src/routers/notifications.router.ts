import { Router, type Request, type Response } from 'express';
import { NotificationController } from '../controllers/notifications.controller.ts';

const router = Router();
const notificationController = new NotificationController();

router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);

export default router;

