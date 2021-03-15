import { MikroORM } from '@mikro-orm/core';
import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';

import { PostResolver } from './graphql/resolvers';
import { _prod_ } from './constants';
import mikroOrmConfig from './mikro-orm.config';

const main = async () => {
  const PORT = process.env.PORT ?? 4000;

  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} 👻`);
  });
};

main().catch((err) => {
  console.error(err);
});
