import React, { useEffect, useState } from 'react';
import { Animated, AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const SIZE = 86;

type Props = {
  isLive: boolean;
  disabled?: boolean;
  busy?: boolean;
  onPress: () => void;
};

export default function GoButton({ isLive, disabled = false, busy = false, onPress }: Props) {
  const [scale] = useState(() => new Animated.Value(1));
  const [pulseScale] = useState(() => new Animated.Value(1));
  const [pulseOpacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (isLive || disabled) {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.5);
      return;
    }

    let isMounted = true;
    let loop: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted || reduceMotion) return;
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.5);
      loop = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.35, duration: theme.motion.goPulse, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: theme.motion.goPulse, useNativeDriver: true }),
        ])
      );
      loop.start();
    });

    return () => {
      isMounted = false;
      loop?.stop();
    };
  }, [isLive, disabled, pulseScale, pulseOpacity]);

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.96, duration: theme.motion.fastMs, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: theme.motion.fastMs, useNativeDriver: true }).start();
  };

  const bg = disabled ? theme.color.ink.raised : isLive ? theme.color.duty.stop : theme.color.primary[500];
  const ring = disabled ? theme.color.ink.line : isLive ? theme.color.duty.stop : theme.color.primary[600];
  const label = isLive ? 'End journey' : 'Go online';

  return (
    <View style={styles.wrap}>
      {!isLive && !disabled ? (
        <Animated.View
          pointerEvents="none"
          testID="go-button-pulse"
          style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
        />
      ) : null}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled, busy }}
          style={[styles.button, { backgroundColor: bg, borderColor: ring }]}
        >
          <View style={disabled ? styles.disabledContent : undefined}>
            <Ionicons name={isLive ? 'stop' : 'play'} size={20} color={theme.color.white} style={styles.icon} />
            <Text style={styles.label}>{isLive ? 'END' : 'GO'}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: theme.color.primary[500],
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledContent: {
    opacity: 0.4,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    ...theme.textStyle('caption', { weight: 'medium', color: theme.color.white }),
    letterSpacing: 1,
  },
});
