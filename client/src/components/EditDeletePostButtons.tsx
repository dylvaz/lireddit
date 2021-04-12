import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { IconButton, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';

import { useDeletePostMutation, useMeQuery } from '../generated/graphql';

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  const [{ data }] = useMeQuery();
  const [, deletePost] = useDeletePostMutation();
  if (data?.me?.id !== creatorId) {
    return null;
  }
  return (
    <>
      <IconButton
        aria-label='Delete post'
        icon={<DeleteIcon />}
        onClick={async () => {
          await deletePost({ id });
        }}
      />
      <NextLink href='/post/edit/[id]' as={`/post/edit/${id}`}>
        <IconButton as={Link} aria-label='Edit post' icon={<EditIcon />} />
      </NextLink>
    </>
  );
};

export default EditDeletePostButtons;
