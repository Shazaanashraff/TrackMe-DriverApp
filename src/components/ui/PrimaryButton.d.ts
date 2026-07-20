import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

declare const PrimaryButton: React.FC<PrimaryButtonProps>;
export default PrimaryButton;
