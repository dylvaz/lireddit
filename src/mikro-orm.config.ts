import { MikroORM } from '@mikro-orm/core';
import path from 'path';

import { Post } from './entities/Post';
import { _prod_ } from './constants';

export default {
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[tj]s$/,
    disableForeignKeys: false,
  },
  entities: [Post],
  dbName: 'lireddit',
  user: 'dev',
  password: 'dev',
  type: 'postgresql',
  debug: !_prod_,
} as Parameters<typeof MikroORM.init>[0];
