/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, _client) => {
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true, sparse: true });

    await db.createCollection('followers');
    await db.collection('followers').createIndex(['actor.id', 'followingUsername'], { name: 'follower-unique-index', unique: true })

    await db.createCollection('following');
    await db.collection('following').createIndex(['followerUsername', 'actorId'], { name: 'following-unique-index', unique: true })
    
    await db.createCollection('feed');
    await db.collection('feed').createIndex({ feedId: 1 }, { unique: true, name: 'feedId_unique' });

    await db.createCollection('notifications');
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 }, { name: 'notifications-unique-index', unique: true });
    
    await db.createCollection('likes');
    await db.collection('likes').createIndex({ postId: 1, likedBy: 1 }, { unique: true, name: 'like-unique-index' });

    await db.createCollection('comments');
    await db.collection('comments').createIndex({ postId: 1, commentedBy: 1, createdAt: -1 });
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, _client) => {
    await db.collection('users').dropIndex('email_1').catch(() => {});
    await db.collection('users').dropIndex('googleId_1').catch(() => {});
    await db.collection('followers').dropIndex('follower-unique-index').catch(() => {});
    await db.collection('following').dropIndex('following-unique-index').catch(() => {});
    await db.collection('feed').dropIndex('feedId_unique').catch(() => {});
    await db.collection('notifications').dropIndex('notifications-unique-index').catch(() => {});
    await db.collection('likes').dropIndex('like-unique-index').catch(() => {});
    await db.collection('comments').dropIndexes().catch(() => {});

    await db.dropCollection('feed').catch(() => {});
    await db.dropCollection('following').catch(() => {});
    await db.dropCollection('followers').catch(() => {});
    await db.dropCollection('users').catch(() => {});
    await db.dropCollection('notifications').catch(() => {});
    await db.dropCollection('likes').catch(() => {});
    await db.dropCollection('comments').catch(() => {});
};
