import { Router } from 'express';
import authRouter from './auth.router';
import profileRouter from './profile.router';
import feedRouter from './feed.router';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/feed', feedRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mastagram API'
  });
});

export default apiRouter;
