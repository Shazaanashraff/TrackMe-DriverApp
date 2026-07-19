import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import FormInput from '../../components/ui/FormInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InlineError from '../../components/ui/InlineError';
import { formatCurrency } from '../../helpers/formatters';
import { AppError, userMessage } from '../../lib/errors';

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
        <View style={styles.sheet}>
          <AppText variant="h2">Request payout</AppText>
          <AppText variant="label" color={theme.color.text.secondary} style={styles.subtitle}>
            {formatCurrency(earningAmount)} will be sent to this account
          </AppText>

          <FormInput
            label="Account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="1234567890"
            keyboardType="number-pad"
            error={fieldErrors.accountNumber}
          />
          <FormInput
            label="Bank name"
            value={bankName}
            onChangeText={setBankName}
            placeholder="Bank of Example"
            error={fieldErrors.bankName}
          />
          <FormInput
            label="IFSC code"
            value={ifscCode}
            onChangeText={setIfscCode}
            placeholder="ABCD0123456"
            autoCapitalize="characters"
            error={fieldErrors.ifscCode}
          />

          {error ? <InlineError message={userMessage(error)} /> : null}

          <PrimaryButton
            title="Submit"
            onPress={handleSubmit}
            loading={isSubmitting}
            style={styles.submitButton}
          />
          <PrimaryButton title="Cancel" variant="secondary" onPress={handleCancel} disabled={isSubmitting} />
        </View>
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
  subtitle: {
    marginTop: theme.space[1],
    marginBottom: theme.space[5],
  },
  submitButton: {
    marginTop: theme.space[2],
    marginBottom: theme.space[3],
  },
});
