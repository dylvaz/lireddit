import 'reflect-metadata';
import { config } from 'dotenv-safe';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { createConnection } from 'typeorm';
import path from 'path';

import { PostResolver } from './graphql/resolvers/postResolvers';
import { COOKIE_NAME, _prod_ } from './constants';
import { UserResolver } from './graphql/resolvers/userResolvers';
import { MyContext } from './types';
import { User } from './entities/User';
import { Post } from './entities/Post';
import { Upvote } from './entities/Upvote';
import { createUserLoader } from './utils/createUserLoader';
import { createUpvoteLoader } from './utils/createUpvoteLoader';

const main = async () => {
  config();
  const connection = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, Upvote, User],
  });

  let retriesDB = 5;
  while (retriesDB) {
    try {
      await connection.runMigrations();
      break;
    } catch (err) {
      console.log(err);
      retriesDB -= 1;
      console.log(`retries left: ${retriesDB}`);
      // wait 5 seconds before attempting to connect to the psql db again
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  //letting express know about the nginx proxy so it forwards cookies and session :)
  app.set('trust proxy', 1);

  app.use(cors({ origin: process.env.CORS_ORGIN, credentials: true }));

  let retriesRedis = 5;

  while (retriesRedis) {
    try {
      app.use(
        session({
          name: COOKIE_NAME,
          store: new RedisStore({ client: redis, disableTouch: false }),
          cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
          },
          saveUninitialized: false,
          secret: process.env.SECRET_KEY,
          resave: false,
        })
      );
      break;
    } catch (err) {
      console.log(err);
      retriesRedis -= 1;
      console.log(`retries left: ${retriesRedis}`);
      // wait 5 seconds before attempting to connect to the redis server again
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  const apolloServer = new ApolloServer({
    playground: true,
    introspection: true,
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      upvoteLoader: createUpvoteLoader(),
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(process.env.PORT, () => {
    console.log(
      `Server running on http://localhost:${process.env.PORT}/graphql ????`
    );
  });
};

main().catch((err) => {
  console.error(err);
});
