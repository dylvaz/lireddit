import { Request, Response } from 'express';
import { Redis } from 'ioredis';

import { createUserLoader } from './utils/createUserLoader';
import { createUpvoteLoader } from './utils/createUpvoteLoader';
declare module 'express-session' {
  export interface SessionData {
    userId: number;
  }
}

export type MyContext = {
  req: Request;
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  upvoteLoader: ReturnType<typeof createUpvoteLoader>;
};
