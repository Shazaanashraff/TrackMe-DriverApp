import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { formatCurrency } from '../../helpers/formatters';
import { AppError, userMessage } from '../../lib/errors';
import FormInput from '../../components/ui/FormInput';
import InlineError from '../../components/ui/InlineError';

export type BankAccount = {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
};

type Props = {
  visible: boolean;
  earningAmount: number;
  isSubmitting: boolean;
  error?: AppError | null;
  onCancel: () => void;
  onSubmit: (bankAccount: BankAccount) => void;
};

export default function PayoutRequestForm({ visible, earningAmount, isSubmitting, error, onCancel, onSubmit }: Props) {
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setAccountNumber('');
    setBankName('');
    setIfscCode('');
    setFieldErrors({});
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!accountNumber.trim()) errors.accountNumber = 'Account number is required';
    if (!bankName.trim()) errors.bankName = 'Bank name is required';
    if (!ifscCode.trim()) errors.ifscCode = 'IFSC code is required';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSubmit({ accountNumber: accountNumber.trim(), bankName: bankName.trim(), ifscCode: ifscCode.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Request Payout</Text>
          <Text style={styles.subtitle}>{formatCurrency(earningAmount)} will be sent to this account</Text>

          <FormInput label="Account Number" value={accountNumber} onChangeText={setAccountNumber} placeholder="1234567890" keyboardType="number-pad" />
          <InlineError message={fieldErrors.accountNumber ?? null} />

          <FormInput label="Bank Name" value={bankName} onChangeText={setBankName} placeholder="Bank of Example" />
          <InlineError message={fieldErrors.bankName ?? null} />

          <FormInput label="IFSC Code" value={ifscCode} onChangeText={setIfscCode} placeholder="ABCD0123456" autoCapitalize="characters" />
          <InlineError message={fieldErrors.ifscCode ?? null} />

          {error && <InlineError message={userMessage(error)} />}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancel} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.confirmText}>{isSubmitting ? 'Submitting…' : 'Submit'}</Text>
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
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: SPACING.sm,
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
    backgroundColor: COLORS.primary,
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
