const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  mongodb: {
    url: process.env.MASTAGRAM_MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
  },

  migrationsDir: 'migrations',

  changelogCollectionName: 'changelog',

  migrationFileExtension: '.js',
};
