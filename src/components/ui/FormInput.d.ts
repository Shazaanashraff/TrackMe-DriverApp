import React from 'react';
import { ViewStyle } from 'react-native';

interface FormInputProps {
  label?: string;
  icon?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: string;
  autoCapitalize?: string;
  secureTextEntry?: boolean;
  style?: ViewStyle;
}

declare const FormInput: React.FC<FormInputProps>;
export default FormInput;
