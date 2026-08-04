import React from 'react';
import { ViewStyle } from 'react-native';

interface ShiftVehicleIconProps {
  size?: number;
  bodyColor?: string;
  detailColor?: string;
  style?: ViewStyle;
}

declare const ShiftVehicleIcon: React.FC<ShiftVehicleIconProps>;
export default ShiftVehicleIcon;
