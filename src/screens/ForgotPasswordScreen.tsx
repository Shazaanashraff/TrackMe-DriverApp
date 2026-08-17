import React, { useState } from 'react';
import { View, ScrollView, StatusBar, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRequestPasswordResetOtp } from '../hooks/auth';
import { AppError, normalizeError, userMessage } from '../lib/errors';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import InlineError from '../components/ui/InlineError';
import ScreenHeader from '../components/ui/ScreenHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : normalizeError(error);
}

const ForgotPasswordScreen = ({ navigation }: { navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void } }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const requestOtp = useRequestPasswordResetOtp();

  const handleSendOtp = () => {
    setEmailError(null);
    setFormError(null);
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError('Email is required');
      return;
    }
    if (!EMAIL_RE.test(normalizedEmail)) {
      setEmailError('Enter a valid email address');
      return;
    }

    requestOtp.mutate(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          navigation.navigate('ForgotPasswordOtp', { email: normalizedEmail });
        },
        onError: (err: unknown) => {
          setFormError(userMessage(asAppError(err)));
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Forgot password" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppText variant="body" color={theme.color.text.secondary} style={styles.subtitle}>
          Enter the email on your driver account and we'll send you a 6-digit code to reset your password.
        </AppText>

        <View style={styles.form}>
          <FormInput
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={(v: string) => { setEmail(v); setEmailError(null); }}
            placeholder="driver@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <InlineError message={emailError} />
          <InlineError message={formError} />

          <PrimaryButton
            title="Send code"
            onPress={handleSendOtp}
            loading={requestOtp.isPending}
            style={styles.submitButton}
          />
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
});

export default ForgotPasswordScreen;
