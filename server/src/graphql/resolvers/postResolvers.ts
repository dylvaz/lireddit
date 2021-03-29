import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { getConnection } from 'typeorm';

import { Post } from '../../entities/Post';
import { isAuth } from '../../middleware/isAuth';

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}
@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string
  ): Promise<Post[]> {
    const realLimit = Math.min(50, limit);
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder('p')
      .orderBy('"createdAt"', 'DESC')
      .take(realLimit);
    if (cursor) {
      qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }
    return qb.getMany();
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('inputs', () => PostInput) input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    try {
      const newPost = await Post.create({
        ...input,
        creatorId: req.session.userId,
      }).save();
      return newPost;
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title', () => String) title: string
  ): Promise<Post | null> {
    try {
      const post = await Post.findOne(id);
      if (!post) {
        return null;
      }
      if (typeof title !== 'undefined') {
        await Post.update({ id }, { title });
      }
      return post;
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id', () => Number) id: number): Promise<Boolean> {
    try {
      await Post.delete(id);
    } catch (err) {
      console.error(err);
      return false;
    }
    return true;
  }
}
