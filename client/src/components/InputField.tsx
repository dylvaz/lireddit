import React from 'react'
import { FormControl, FormLabel, Input } from '@chakra-ui/react';
import { useField } from 'formik';


interface InputFieldProps {

}

const InputField: React.FC<InputFieldProps> = ({}) => {
  const [] = useField();
  
  return (<FormControl>
    <FormLabel htmlFor='username'>Username</FormLabel>
    <Input
      value={values.username}
      onChange={handleChange}
      id='username'
      placeholder='username'
    ></Input>
    {/* <FormErrorMessage>{form.errors.message}</FormErrorMessage> */}
  </FormControl>)
}

export const InputField;