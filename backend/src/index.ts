import express from 'express';
import ActivitypubExpress from 'activitypub-express';
import passport from './configs/passport.config';
import apiRouter from './routers';
import { getDb, initMongo } from './configs/mongodb.config';
import appConfig from './configs/app.config';

import { setupSwaggerDocs } from './configs/swagger';

const app  = express();
setupSwaggerDocs(app);

app.use(passport.initialize());

app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

// add routes that are not part of ActivityPub Express here
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.send('Welcome to Mastagram ActivityPub Server!');
});

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

app.use(
  express.json({ type: apex.consts.jsonldTypes }),
  express.urlencoded({ extended: true }),
  apex
);

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


initMongo().then(() => {
    apex.store.db = getDb();
    return apex.store.setup();
  })
  .then(() => {
    app.listen(appConfig.port, () => console.log(`Apex app listening on port ${appConfig.port}`));
  })
  .catch(console.error);