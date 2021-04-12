import React from 'react';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import { Box, Heading } from '@chakra-ui/react';

import { createUrqlClient } from '../../utils/createUrqlClient';
import Layout from '../../components/Layout';
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl';
import EditDeletePostButtons from '../../components/EditDeletePostButtons';

const singlePostPage: NextPage = () => {
  const [{ data, fetching }] = useGetPostFromUrl();

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
    <div>
      <Layout>
        <Heading mb={4}>{data.post.title}</Heading>
        <Box mb={4}>{data.post.text}</Box>
        <EditDeletePostButtons
          id={data.post.id}
          creatorId={data.post.creator.id}
        />
      </Layout>
    </div>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(singlePostPage);
