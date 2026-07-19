import React, { useEffect, useState } from 'react';
import { Animated, AccessibilityInfo, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '../../theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
  testID?: string;
};

export default function Skeleton({ width = '100%', height = 16, radius = theme.radius.control, style, testID }: Props) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    let isMounted = true;
    let loop: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted || reduceMotion) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
    });

    return () => {
      isMounted = false;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      testID={testID}
      style={[styles.base, { width, height, borderRadius: radius, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.color.surface.field,
  },
});
