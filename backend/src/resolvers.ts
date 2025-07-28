import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Subscription event names
const POST_ADDED = 'POST_ADDED';
const POST_UPDATED = 'POST_UPDATED';
const POST_DELETED = 'POST_DELETED';

interface CreatePostInput {
  title: string;
  content: string;
  author: string;
  tags?: string[];
  published?: boolean;
}

interface UpdatePostInput {
  title?: string;
  content?: string;
  author?: string;
  tags?: string[];
  published?: boolean;
}

export const resolvers = {

};