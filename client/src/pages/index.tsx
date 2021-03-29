import { withUrqlClient } from 'next-urql';
import { Link } from '@chakra-ui/react';
import NextLink from 'next/link';

import Layout from '../components/Layout';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <Layout>
      <NextLink href='/create-post'>
        <Link>create post</Link>
      </NextLink>
      <br />
      {!data
        ? null
        : data.posts.map((p) => {
            return <div key={p.id}>{p.title}</div>;
          })}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
