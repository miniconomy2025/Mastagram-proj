import express from 'express';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import ActivitypubExpress from 'activitypub-express';
import passport from './configs/passport.config';
import apiRouter from './routers';
import { getDb, initMongo } from './configs/mongodb.config';
import appConfig from './configs/app.config';
import { setupSwaggerDocs } from './configs/swagger';

// GraphQL imports
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const app = express();
const httpServer = http.createServer(app);

// Setup Swagger documentation
setupSwaggerDocs(app);

// Initialize Passport
app.use(passport.initialize());

// API middleware
app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

// Add routes that are not part of ActivityPub Express here
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Mastagram ActivityPub Server with GraphQL!');
});

// ActivityPub routes configuration
const routes = {
  actor: '/u/:actor',
  object: '/o/:id',
  activity: '/s/:id',
  inbox: '/u/:actor/inbox',
  outbox: '/u/:actor/outbox',
  followers: '/u/:actor/followers',
  following: '/u/:actor/following',
  liked: '/u/:actor/liked',
  collections: '/u/:actor/c/:id',
  blocked: '/u/:actor/blocked',
  rejections: '/u/:actor/rejections',
  rejected: '/u/:actor/rejected',
  shares: '/s/:id/shares',
  likes: '/s/:id/likes'
};

// Initialize ActivityPub Express
const apex = ActivitypubExpress({
  name: 'Mastagram',
  version: '1.0',
  domain: appConfig.hostname,
  actorParam: 'actor',
  objectParam: 'id',
  activityParam: 'id',
  routes,
  endpoints: {
    proxyUrl: `${appConfig.hostname}/proxy`,
  },
});

// ActivityPub middleware
app.use(
  express.json({ type: apex.consts.jsonldTypes }),
  express.urlencoded({ extended: true }),
  apex
);

// ActivityPub routes
app.post(routes.inbox, apex.net.inbox.post);
app.post(routes.outbox, apex.net.outbox.post);
app.get(routes.actor, apex.net.actor.get);
app.get(routes.followers, apex.net.followers.get);
app.get(routes.following, apex.net.following.get);
app.get(routes.likes, apex.net.likes.get);
app.get(routes.object, apex.net.object.get);
app.get(routes.activity, apex.net.activityStream.get);
app.get(routes.liked, apex.net.liked.get);
app.get('/.well-known/webfinger', apex.net.webfinger.get);
app.get('/.well-known/nodeinfo', apex.net.nodeInfoLocation.get);
app.get('/nodeinfo/:version', apex.net.nodeInfo.get);
app.post('/proxy', apex.net.proxy.post);

console.log(`Apex initialized with routes: `);

// Initialize GraphQL Server
async function setupGraphQL() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // GraphQL server is initialized but no Express middleware applied

  console.log(`GraphQL Server ready at http://localhost:${appConfig.port}/graphql`);
}


// Initialize everything
async function startServer() {
  try {
    // Initialize MongoDB
    await initMongo();
    
    // Setup ActivityPub store
    apex.store.db = getDb();
    await apex.store.setup();
    
    // Setup GraphQL
    await setupGraphQL();
    
    // Start the server
    await new Promise<void>((resolve) =>
      httpServer.listen({ port: appConfig.port }, resolve)
    );
    
    console.log(`🚀 Mastagram server running on port ${appConfig.port}`);
    console.log(`📊 GraphQL Playground: http://localhost:${appConfig.port}/graphql`);
    console.log(`🔗 ActivityPub: http://localhost:${appConfig.port}`);
    
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();