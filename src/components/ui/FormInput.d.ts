import React from 'react';
import { ViewStyle } from 'react-native';

interface FormInputProps {
  label?: string;
  icon?: string;
  error?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: string;
  autoCapitalize?: string;
  // Forwarded to the underlying TextInput along with the rest of the props.
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  style?: ViewStyle;
}

declare const FormInput: React.FC<FormInputProps>;
export default FormInput;
