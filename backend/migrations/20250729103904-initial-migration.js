/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, _client) => {
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true });

    await db.createCollection('posts');

    await db.createCollection('followers');
    await db.collection('followers').createIndex(['actor.id', 'followingUsername'], { name: 'follower-unique-index', unique: true })

    await db.createCollection('following');
    await db.collection('following').createIndex(['followerUsername', 'actorId'], { name: 'following-unique-index', unique: true })
    
    await db.createCollection('feed');
    await db.collection('feed').createIndex({ feedId: 1 }, { unique: true, name: 'feedId_unique' });
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, _client) => {
    await db.dropCollection('feed');
    await db.dropCollection('following');
    await db.dropCollection('followers');
    await db.dropCollection('posts');
    await db.dropCollection('users');
};
