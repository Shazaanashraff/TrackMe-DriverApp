import React, { useEffect, useState } from 'react';
import { Animated, AccessibilityInfo, Modal, View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from './AppText';
import PrimaryButton from './PrimaryButton';

// Off-screen starting offset for the spring entrance — larger than any
// realistic sheet height, so it always starts fully below the viewport.
const SHEET_TRAVEL = 480;

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const [translateY] = useState(() => new Animated.Value(SHEET_TRAVEL));

  useEffect(() => {
    if (!visible) return undefined;

    let isMounted = true;
    translateY.setValue(SHEET_TRAVEL);

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) return;
      if (reduceMotion) {
        translateY.setValue(0);
        return;
      }
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: theme.motion.sheetSpring.damping,
        stiffness: theme.motion.sheetSpring.stiffness,
        mass: theme.motion.sheetSpring.mass,
      }).start();
    });

    return () => {
      isMounted = false;
    };
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <AppText variant="h2">{title}</AppText>
          <AppText variant="label" color={theme.color.text.secondary} style={styles.message}>
            {message}
          </AppText>
          <PrimaryButton
            title={confirmLabel}
            variant="danger"
            onPress={onConfirm}
            loading={loading}
            style={styles.confirmButton}
          />
          <PrimaryButton
            title={cancelLabel}
            variant="secondary"
            onPress={onCancel}
            disabled={loading}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface.card,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    padding: theme.space[5],
    paddingBottom: theme.space[8],
    ...theme.elevation.sheet,
  },
  message: {
    marginTop: theme.space[2],
    marginBottom: theme.space[5],
  },
  confirmButton: {
    marginBottom: theme.space[3],
  },
});
