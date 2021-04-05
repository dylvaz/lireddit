import { MyContext } from 'src/types';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { getConnection } from 'typeorm';

import { Post } from '../../entities/Post';
import { isAuth } from '../../middleware/isAuth';
@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}
@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50) + '...';
  }
  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit) + 1;
    const replacements: any[] = [realLimit];
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    const posts = await getConnection().query(
      `
    SELECT p.*,
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
    ) creator
    from post p
    inner join "user" u on u.id = p."creatorId"
    ${cursor ? ' where p."createdAt" < $2' : ''}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );
    return {
      posts: posts.slice(0, realLimit - 1),
      hasMore: posts.length === realLimit,
    };
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
