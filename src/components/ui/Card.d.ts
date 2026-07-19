import React from 'react';
import { ViewStyle } from 'react-native';

interface CardProps {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  testID?: string;
}

declare const Card: React.FC<CardProps>;
export default Card;
