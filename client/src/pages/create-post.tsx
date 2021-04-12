import React from 'react';
import { Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';

import InputField from '../components/InputField';
import { useCreatePostMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import Layout from '../components/Layout';
import { useIsAuth } from '../utils/useIsAuth';

interface CreatePostProps {}

const CreatePost: React.FC<CreatePostProps> = ({}) => {
  const router = useRouter();
  useIsAuth();
  const [, createPost] = useCreatePostMutation();
  return (
    <div>
      <Layout variant='small'>
        <Formik
          initialValues={{ title: '', text: '' }}
          onSubmit={async (values, { setFieldError }) => {
            if (values.text === '') {
              setFieldError('text', 'text field cannot be empty');
            }
            if (values.title === '') {
              setFieldError('title', 'title field cannot be empty');
            } else {
              const { error } = await createPost({ inputs: values });
              if (!error) {
                router.push('/');
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
                Create Post
              </Button>
            </Form>
          )}
        </Formik>
      </Layout>
    </div>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
