import React from 'react';
import { ViewStyle } from 'react-native';

interface ListRowProps {
  icon?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  divider?: boolean;
  testID?: string;
  style?: ViewStyle;
}

declare const ListRow: React.FC<ListRowProps>;
export default ListRow;
