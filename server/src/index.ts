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

  await connection.runMigrations();
  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  //letting express know about the nginx proxy so it forwards cookies and session :)
  app.set('trust proxy', 1);

  app.use(cors({ origin: process.env.CORS_ORGIN, credentials: true }));

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: false }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        secure: _prod_,
        sameSite: 'lax',
        domain: _prod_ ? '.dylvaz.dev' : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SECRET_KEY,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
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
    console.log(`Server running on http://localhost:${process.env.PORT} 👻`);
  });
};

main().catch((err) => {
  console.error(err);
});
