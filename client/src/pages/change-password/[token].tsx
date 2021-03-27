import React, { useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { useRouter } from 'next/router';
import { withUrqlClient, NextComponentType } from 'next-urql';
import NextLink from 'next/link';

import InputField from '../../components/InputField';
import Wrapper from '../../components/Wrapper';
import { toErrorMap } from '../../utils/toErrorMap';
import { useChangePasswordMutation } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';

interface ChangePasswordProps {
  token: string;
}

const ChangePassword: NextPage<ChangePasswordProps> = ({ token }) => {
  const router = useRouter();
  const [tokenError, setTokenError] = useState('');
  const [, changePassword] = useChangePasswordMutation();
  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ token, newPassword: '', newPasswordComp: '' }}
        onSubmit={async (values, { resetForm, setErrors, setFieldError }) => {
          if (values.newPasswordComp === values.newPassword) {
            const response = await changePassword({
              newPassword: values.newPassword,
              token,
            });
            if (response.data?.changePassword.errors) {
              const errorMap = toErrorMap(response.data.changePassword.errors);
              if ('token' in errorMap) {
                setTokenError(errorMap.token);
              }
              setErrors(errorMap);
            } else if (response.data?.changePassword.user) {
              router.push('/');
            }
          } else {
            setFieldError('newPasswordComp', 'passwords must match');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name='newPassword'
              placeholder='new password'
              label='New Password'
              type='password'
            />
            <Box mt={4}>
              <InputField
                name='newPasswordComp'
                placeholder='confirm new password'
                label='Confirm New Password'
                type='password'
              />
            </Box>
            {tokenError ? (
              <Flex>
                <Box mr={2} color='red'>
                  {tokenError}
                </Box>
                <NextLink href='/forgot-password'>
                  <Link>click here to get a new one</Link>
                </NextLink>
              </Flex>
            ) : null}
            <Button
              mt={4}
              type='submit'
              isLoading={isSubmitting}
              colorScheme='teal'
            >
              change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

ChangePassword.getInitialProps = async ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default withUrqlClient(createUrqlClient)(
  (ChangePassword as unknown) as NextComponentType
);
