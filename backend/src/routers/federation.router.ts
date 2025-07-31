import { Router } from "express";
import userRouter from "./user.router.ts";
import postRouter from "./post.router.ts";

const apiRouter = Router();

apiRouter.use('/users', userRouter);
apiRouter.use('/posts', postRouter);

export default apiRouter;
