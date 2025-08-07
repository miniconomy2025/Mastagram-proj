import { Router } from 'express';
import { ensureAuthenticated } from '../configs/passport.config.ts';
import { FollowController } from '../controllers/follow.controller.ts';
const followRouter = Router();

followRouter.post('/:userId', ensureAuthenticated, FollowController.followUser);

followRouter.delete('/:userId', ensureAuthenticated, FollowController.unfollowUser);

export default followRouter;