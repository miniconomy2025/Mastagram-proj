import type { User } from "../models/user.models.ts";

declare module 'express-serve-static-core' {
    interface Request {
        user?: User,
    }
}