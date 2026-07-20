import React from 'react';
import { TextProps } from 'react-native';

interface AppTextProps extends TextProps {
  variant?: 'display' | 'h1' | 'h2' | 'body' | 'label' | 'caption' | 'overline';
  weight?: 'regular' | 'medium';
  onInk?: boolean;
  color?: string;
  children?: React.ReactNode;
}

declare const AppText: React.FC<AppTextProps>;
export default AppText;
