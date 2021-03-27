import { MikroORM } from '@mikro-orm/core';
import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';

import { PostResolver } from './graphql/resolvers/postResolvers';
import { COOKIE_NAME, _prod_ } from './constants';
import mikroOrmConfig from './mikro-orm.config';
import { UserResolver } from './graphql/resolvers/userResolvers';
import { MyContext } from './types';

require('dotenv').config({ path: __dirname + '/.env' });

const main = async () => {
  const PORT = process.env.PORT ?? 4000;
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

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
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res, redis }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} 👻`);
  });
};

main().catch((err) => {
  console.error(err);
});
