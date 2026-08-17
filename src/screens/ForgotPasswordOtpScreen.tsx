import React, { useState } from 'react';
import { View, ScrollView, StatusBar, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useVerifyPasswordResetOtp, useRequestPasswordResetOtp } from '../hooks/auth';
import { AppError, normalizeError, userMessage } from '../lib/errors';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import InlineError from '../components/ui/InlineError';
import ScreenHeader from '../components/ui/ScreenHeader';

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : normalizeError(error);
}

type Route = { params?: { email?: string } };

const ForgotPasswordOtpScreen = ({
  navigation,
  route,
}: {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: Route;
}) => {
  const email = route?.params?.email || '';
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const verifyOtp = useVerifyPasswordResetOtp();
  const resendOtp = useRequestPasswordResetOtp();

  const handleVerify = () => {
    setOtpError(null);
    setFormError(null);
    const trimmed = otp.trim();

    if (!trimmed) {
      setOtpError('Enter the 6-digit code');
      return;
    }
    if (!/^\d{6}$/.test(trimmed)) {
      setOtpError('Code must be exactly 6 digits');
      return;
    }

    verifyOtp.mutate(
      { email, otp: trimmed },
      {
        onSuccess: (response: unknown) => {
          const resetToken = (response as { resetToken?: string })?.resetToken || '';
          navigation.navigate('ResetPassword', { email, resetToken });
        },
        onError: (err: unknown) => {
          setFormError(userMessage(asAppError(err)));
        },
      }
    );
  };

  const handleResend = () => {
    if (resendOtp.isPending) return;
    setResendError(null);
    resendOtp.mutate(
      { email },
      {
        onError: (err: unknown) => {
          setResendError(userMessage(asAppError(err)));
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Enter code" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppText variant="body" color={theme.color.text.secondary} style={styles.subtitle}>
          {`Enter the 6-digit code sent to ${email}`}
        </AppText>

        <View style={styles.form}>
          <FormInput
            label="Verification code"
            icon="key-outline"
            value={otp}
            onChangeText={(v: string) => { setOtp(v); setOtpError(null); }}
            placeholder="123456"
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <InlineError message={otpError} />
          <InlineError message={formError} />

          <PrimaryButton
            title="Verify code"
            onPress={handleVerify}
            loading={verifyOtp.isPending}
            style={styles.submitButton}
          />

          <PrimaryButton
            title={resendOtp.isPending ? 'Sending…' : 'Resend code'}
            variant="secondary"
            onPress={handleResend}
            disabled={resendOtp.isPending}
            style={styles.resendButton}
          />
          <InlineError message={resendError} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    paddingHorizontal: theme.space[5],
    marginBottom: theme.space[2],
  },
  form: {
    padding: theme.space[5],
  },
  submitButton: {
    marginTop: theme.space[2],
  },
  resendButton: {
    marginTop: theme.space[3],
  },
});

export default ForgotPasswordOtpScreen;
