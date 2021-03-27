import { UsernamePasswordInput } from '../graphql/resolvers/UsernamePasswordInput';

export const validateRegister = (options: UsernamePasswordInput) => {
  if (options.username.length <= 2) {
    return [
      {
        field: 'username',
        message: 'length must be greater than 2',
      },
    ];
  }
  if (options.username.includes('@')) {
    return [
      {
        field: 'username',
        message: 'username cannot contain an @ sign',
      },
    ];
  }
  if (options.password.length <= 3) {
    return [
      {
        field: 'password',
        message: 'length must be greater than 3',
      },
    ];
  }
  if (!options.email.includes('@')) {
    return [
      {
        field: 'email',
        message: 'please enter a valid email',
      },
    ];
  }
  return null;
};
