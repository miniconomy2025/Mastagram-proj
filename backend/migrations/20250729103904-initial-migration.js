/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, _client) => {
    await db.createCollection('users');
    await db.createCollection('posts');
    await db.createCollection('followers');
    await db.createCollection('following');
    await db.collection('followers').createIndex(['actor.id', 'followingUsername'], { name: 'follower-unique-index', unique: true })
    await db.collection('following').createIndex(['followerUsername', 'actorId'], { name: 'following-unique-index', unique: true })
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, _client) => {
    await db.collection('following').dropIndex('following-unique-index');
    await db.collection('followers').dropIndex('follower-unique-index');
    await db.dropCollection('following');
    await db.dropCollection('followers');
    await db.dropCollection('posts');
    await db.dropCollection('users');
};
