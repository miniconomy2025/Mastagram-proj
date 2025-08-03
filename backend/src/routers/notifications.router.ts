import { Router, type Request, type Response } from 'express';
import { NotificationController } from '../controllers/notifications.controller.ts';
import { ensureAuthenticated } from '../configs/passport.config.ts';

const router = Router();
const notificationController = new NotificationController();
router.use(ensureAuthenticated);

router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.updateReadStatus);

export default router;

