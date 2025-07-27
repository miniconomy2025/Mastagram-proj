module.exports = {
  async up(db, client) {
    // Create users collection for authentication and profile
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true });
  },
  async down(db, client) {
    await db.collection('users')?.drop();
  },
};
