import express from "express";
import { integrateFederation } from "@fedify/express";
import federation from "./federation/federation.ts";
import apiRouter from "./routers/federation.router.ts";

export const app = express();

app.set('trust proxy', true);

app.use('/federation', apiRouter);

app.use(integrateFederation(federation, (_req) => undefined));

app.get('/', (_req, res) => res.send('Hello, Fedify!'));

export default app;
