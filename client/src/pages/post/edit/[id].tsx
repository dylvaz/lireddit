import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';

import InputField from '../../../components/InputField';
import Layout from '../../../components/Layout';
import {
  usePostQuery,
  useUpdatePostMutation,
} from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useGetIntId } from '../../../utils/useGetIntId';

const UpdatePost: NextPage = () => {
  const router = useRouter();
  const intId = useGetIntId();
  const [, updatePost] = useUpdatePostMutation();
  const [{ data, fetching }] = usePostQuery({
    pause: intId === -1,
    variables: {
      id: intId,
    },
  });

  if (fetching) {
    return (
      <Layout>
        <div>loading ...</div>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <div>could not find post 😅</div>
      </Layout>
    );
  }

  return (
    <Layout variant='small'>
      <Formik
        initialValues={{
          title: data.post.title,
          text: data.post.text,
        }}
        onSubmit={async (values, { setFieldError }) => {
          if (values.text === '') {
            setFieldError('text', 'text field cannot be empty');
          }
          if (values.title === '') {
            setFieldError('title', 'title field cannot be empty');
          } else {
            const { error } = await updatePost({
              id: intId,
              ...values,
            });
            if (!error) {
              router.back();
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name='title'
              placeholder='title'
              label='Title'
              type='text'
            />
            <Box mt={4}>
              <InputField
                name='text'
                placeholder='text'
                label='Text'
                type='text'
              />
            </Box>
            <Button
              mt={4}
              type='submit'
              isLoading={isSubmitting}
              colorScheme='teal'
            >
              Update Post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(UpdatePost);
