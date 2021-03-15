import { MikroORM } from '@mikro-orm/core';

import { _prod_ } from './constants';
import mikroOrmConfig from './mikro-orm.config';

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
};

main().catch((err) => {
  console.error(err);
});