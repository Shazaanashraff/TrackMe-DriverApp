import React from 'react';
import { ViewStyle } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

declare const ScreenHeader: React.FC<ScreenHeaderProps>;
export default ScreenHeader;
