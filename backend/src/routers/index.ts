import { Router } from 'express';
import authRouter from './auth.router.ts';
import profileRouter from './profile.router.ts';
import feedRouter from './feed.router.ts';
import federationRouter from './federation.router.ts';
import notificationsRouter from './notifications.router.ts';
import followRouter from './follow.router.ts';
import savedPostsRouter from './saved-post.router.ts';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/feed', feedRouter);
apiRouter.use('/federation', federationRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/follow', followRouter);
apiRouter.use('/saved-posts', savedPostsRouter);


// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mastagram API'
  });
});

export default apiRouter;
