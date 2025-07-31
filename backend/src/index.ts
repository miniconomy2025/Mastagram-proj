import dotenv from "dotenv";
import app from "./app.ts";
import "./logger.ts";
import config from "./config.ts";
import logger from "./logger.ts";

dotenv.config();

app.listen(config.app.port, () => {
  logger.info`Server started at http://localhost:${config.app.port}`;
  logger.info`Configuration: ${config}`;
});
