import dotenv from "dotenv";

dotenv.config();

export default {
  mongodb: {
    url: process.env.MONGO_URL,
    databaseName: process.env.MONGO_DB_NAME,
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  lockCollectionName: "changelog_lock",
  lockTtl: 0,
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: 'esm',
};
