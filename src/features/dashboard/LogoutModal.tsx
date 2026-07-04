import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

type Props = {
  visible: boolean;
  isLoggingOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutModal({ visible, isLoggingOut, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </View>
          <Text style={styles.title}>Log out?</Text>
          <Text style={styles.message}>Are you sure you want to logout from your driver account?</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoggingOut}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton, isLoggingOut && styles.confirmButtonDisabled]}
              onPress={onConfirm}
              disabled={isLoggingOut}
            >
              <Text style={styles.confirmText}>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmButton: {
    backgroundColor: COLORS.error,
  },
  confirmButtonDisabled: {
    opacity: 0.65,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
