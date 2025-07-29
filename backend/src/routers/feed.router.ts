import { Router } from "express";
import { FeedController } from "../controllers/feed.controller";
import { ensureAuthenticated } from "../configs/passport.config";
import { upload } from "../configs/multer.config";

const router = Router();
const feedController = new FeedController();

router.use(ensureAuthenticated);

router.post("/", upload.array('media'), feedController.uploadFeed);

export default router;