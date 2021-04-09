import React, { useState } from 'react';

import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

interface UpvoteSectionProps {
  post: PostSnippetFragment;
}

const UpvoteSection: React.FC<UpvoteSectionProps> = ({ post }) => {
  const [, vote] = useVoteMutation();
  const [loadingState, setLoadingState] = useState<
    'upvote-loading' | 'downvote-loading' | 'not-loading'
  >('not-loading');
  return (
    <Flex direction='column' alignItems='center' justifyContent='center' mr={4}>
      <IconButton
        aria-label='upvote'
        icon={<ChevronUpIcon w={8} h={8} />}
        color={post.voteStatus === 1 ? 'darkorange' : 'grey'}
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState('upvote-loading');
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'upvote-loading'}
      />
      {post.points}
      <IconButton
        aria-label='downvote'
        icon={<ChevronDownIcon w={8} h={8} />}
        color={post.voteStatus === -1 ? 'blue' : 'grey'}
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState('downvote-loading');
          await vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState('not-loading');
        }}
        isLoading={loadingState === 'downvote-loading'}
      />
    </Flex>
  );
};

export default UpvoteSection;
