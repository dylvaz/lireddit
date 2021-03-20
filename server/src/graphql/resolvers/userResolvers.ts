import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';

import { User } from '../../entities/User';
import { MyContext } from '../../types';

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }
    try {
      const user = await em.findOne(User, { id: req.session.userId });
      return user;
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    try {
      if (options.username.length <= 2) {
        return {
          errors: [
            {
              field: 'username',
              message: 'Length must be greater than 2.',
            },
          ],
        };
      }
      if (options.password.length <= 3) {
        return {
          errors: [
            {
              field: 'password',
              message: 'length must be greater than 3',
            },
          ],
        };
      }
      const exists = await em.findOne(User, {
        username: options.username.toLowerCase(),
      });
      if (exists) {
        return {
          errors: [
            {
              field: 'username',
              message: 'Username has already been taken',
            },
          ],
        };
      }
      const hashedPassword = await argon2.hash(options.password);
      const user = em.create(User, {
        username: options.username.toLowerCase(),
        password: hashedPassword,
      });
      await em.persistAndFlush(user);
      req.session.userId = user.id;
      return {
        user,
      };
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    try {
      const user = await em.findOne(User, {
        username: options.username.toLowerCase(),
      });
      if (!user) {
        return {
          errors: [
            {
              field: 'username',
              message: "Username doesn't exist",
            },
          ],
        };
      }
      const valid = await argon2.verify(user.password, options.password);
      if (!valid) {
        return {
          errors: [
            {
              field: 'password',
              message: 'Incorrect password',
            },
          ],
        };
      }
      req.session.userId = user.id;
      return {
        user,
      };
    } catch (err) {
      throw new Error(err);
    }
  }
}
