import { Router } from 'express';
import authRouter from './auth.router';
import userRouter from './user.router';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);

apiRouter.use('/user', userRouter);

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mastagram API'
  });
});

export default apiRouter;
