import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../../entities/User';
import { MyContext } from '../../types';
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../../utils/validateRegister';
import { sendEmail } from '../../utils/sendEmail';

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
      const errors = validateRegister(options);
      if (errors) {
        return { errors };
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
        email: options.email.toLowerCase(),
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
    @Arg('usernameOrEmail', () => String) usernameOrEmail: string,
    @Arg('password', () => String) password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    try {
      const user = await em.findOne(
        User,
        usernameOrEmail.includes('@')
          ? {
              email: usernameOrEmail.toLowerCase(),
            }
          : { username: usernameOrEmail.toLowerCase() }
      );
      if (!user) {
        return {
          errors: [
            {
              field: 'usernameOrEmail',
              message: "Username doesn't exist",
            },
          ],
        };
      }
      const valid = await argon2.verify(user.password, password);
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
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        if (err) {
          resolve(false);
          return;
        }
        res.clearCookie(COOKIE_NAME);
        resolve(true);
      })
    );
  }
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email', () => String) email: string,
    @Ctx()
    { em, redis }: MyContext
  ) {
    const user = await em.findOne(User, { email });
    if (!user) {
      return true;
    }
    const token = uuidv4();

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3
    );

    await sendEmail(
      email,
      `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token', () => String) token: string,
    @Arg('newPassword', () => String) newPassword: string,
    @Ctx() { em, redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be greater than 3',
          },
        ],
      };
    }
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userID = await redis.get(key);
    if (!userID) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const user = await em.findOne(User, { id: parseInt(userID) });

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      };
    }

    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    await redis.del(key);

    req.session.userId = user.id;

    return { user };
  }
}
