import argon2 from 'argon2';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { v4 as uuidv4 } from 'uuid';
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../../constants';
import { User } from '../../entities/User';
import { MyContext } from '../../types';
import { sendEmail } from '../../utils/sendEmail';
import { validateRegister } from '../../utils/validateRegister';
import { UsernamePasswordInput } from './UsernamePasswordInput';

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

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    //this is the current user and it's okay to show them the email
    if (req.session.userId === user.id) {
      return user.email;
    }
    return '';
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    if (!req.session.userId) {
      return undefined;
    }
    try {
      const user = await User.findOne(req.session.userId);
      return user;
    } catch (err) {
      throw new Error(err);
    }
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options', () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    try {
      const errors = validateRegister(options);
      if (errors) {
        return { errors };
      }
      const exists = await User.findOne({
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
      const user = await User.create({
        username: options.username.toLowerCase(),
        password: hashedPassword,
        email: options.email.toLowerCase(),
      }).save();
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
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    try {
      const user = await User.findOne(
        usernameOrEmail.includes('@')
          ? { where: { email: usernameOrEmail.toLowerCase() } }
          : { where: { username: usernameOrEmail.toLowerCase() } }
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
    { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
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
    @Ctx() { redis, req }: MyContext
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
    const userIdNum = parseInt(userID);
    const user = await User.findOne(userIdNum);

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

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);

    req.session.userId = user.id;

    return { user };
  }
}
