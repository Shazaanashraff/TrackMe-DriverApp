import React from 'react';
import { ViewStyle } from 'react-native';

interface ShiftBusIconProps {
  size?: number;
  bodyColor?: string;
  detailColor?: string;
  style?: ViewStyle;
}

declare const ShiftBusIcon: React.FC<ShiftBusIconProps>;
export default ShiftBusIcon;
