import 'reflect-metadata';
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

require('dotenv').config({ path: __dirname + '/.env' });

const main = async () => {
  const PORT = process.env.PORT ?? 4000;
  const connection = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'dev',
    password: 'dev',
    database: 'lireddit_type_orm',
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, Upvote, User],
  });
  await connection.runMigrations();
  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: false }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        secure: _prod_,
        sameSite: 'lax',
      },
      saveUninitialized: false,
      secret: 'MFDOOMLAKERS',
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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} 👻`);
  });
};

main().catch((err) => {
  console.error(err);
});
