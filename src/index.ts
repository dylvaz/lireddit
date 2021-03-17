import { MikroORM } from '@mikro-orm/core';
import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';

import { PostResolver } from './graphql/resolvers/postResolvers';
import { _prod_ } from './constants';
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
  const redisClient = redis.createClient();

  app.use(
    session({
      name: 'rqa',
      store: new RedisStore({ client: redisClient, disableTouch: false }),
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
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} 👻`);
  });
};

main().catch((err) => {
  console.error(err);
});
