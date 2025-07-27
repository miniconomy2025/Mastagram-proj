import { Router } from 'express';
import authRouter from './auth.router';

const apiRouter = Router();

// Mount authentication routes
apiRouter.use('/auth', authRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mastagram API'
  });
});

export default apiRouter;
