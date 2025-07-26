module.exports = {
  async up(db, client) {
    await db.createCollection('inbox');
    await db.collection('inbox').createIndex({ id: 1 });
    await db.collection('inbox').createIndex({ actor: 1 });

    await db.createCollection('outbox');
    await db.collection('outbox').createIndex({ id: 1 });
    await db.collection('outbox').createIndex({ actor: 1 });

    await db.createCollection('actors');
    await db.collection('actors').createIndex({ id: 1 });
    await db.collection('actors').createIndex({ inbox: 1 });
    await db.collection('actors').createIndex({ outbox: 1 });

    await db.createCollection('objects');
    await db.collection('objects').createIndex({ id: 1 });
    await db.collection('objects').createIndex({ type: 1 });

    await db.createCollection('activities');
    await db.collection('activities').createIndex({ id: 1 });
    await db.collection('activities').createIndex({ type: 1 });
    await db.collection('activities').createIndex({ actor: 1 });

    await db.createCollection('likes');
    await db.collection('likes').createIndex({ id: 1 });
    await db.collection('likes').createIndex({ actor: 1 });
    await db.collection('likes').createIndex({ object: 1 });

    await db.createCollection('liked');
    await db.collection('liked').createIndex({ id: 1 });
    await db.collection('liked').createIndex({ actor: 1 });
    await db.collection('liked').createIndex({ object: 1 });

    await db.createCollection('followers');
    await db.collection('followers').createIndex({ id: 1 });
    await db.collection('followers').createIndex({ actor: 1 });

    await db.createCollection('following');
    await db.collection('following').createIndex({ id: 1 });
    await db.collection('following').createIndex({ actor: 1 });

  },
  async down(db, client) {
    await db.collection('inbox')?.drop();
    await db.collection('outbox')?.drop();
    await db.collection('actors')?.drop();
    await db.collection('objects')?.drop();
    await db.collection('activities')?.drop();
    await db.collection('likes')?.drop();
    await db.collection('liked')?.drop();
    await db.collection('followers')?.drop();
    await db.collection('following')?.drop();
  },
};
