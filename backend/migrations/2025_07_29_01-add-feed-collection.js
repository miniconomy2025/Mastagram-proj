module.exports = {
  async up(db, client) {
    await db.createCollection('feed');
    await db.collection('feed').createIndex({ feedId: 1 }, { unique: true, name: 'feedId_unique' });
  },
  async down(db, client) {
    await db.collection('feed')?.drop();
  },
};