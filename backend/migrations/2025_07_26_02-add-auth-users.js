module.exports = {
  async up(db, client) {
    // Create users collection for authentication and profile
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    // Store Google ID for federated login
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true });

    // Profile fields for each user document:
    // {
    //   email: String (unique, required)
    //   googleId: String (unique, optional, for Google auth)
    //   username: String (unique, required)
    //   avatar: String (URL to profile picture, optional)
    //   bio: String (short description, optional)
    // }
    // (No need to create separate collections for profile, store in users)
  },
  async down(db, client) {
    await db.collection('users')?.drop();
  },
};
