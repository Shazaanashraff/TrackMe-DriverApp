import React from 'react';
import { ViewStyle } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

declare const EmptyState: React.FC<EmptyStateProps>;
export default EmptyState;
