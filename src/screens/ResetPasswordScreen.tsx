import React, { useState } from 'react';
import { View, ScrollView, StatusBar, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useResetPassword } from '../hooks/auth';
import { AppError, normalizeError, userMessage } from '../lib/errors';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import InlineError from '../components/ui/InlineError';
import ScreenHeader from '../components/ui/ScreenHeader';
import EmptyState from '../components/ui/EmptyState';

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : normalizeError(error);
}

type Route = { params?: { email?: string; resetToken?: string } };

const ResetPasswordScreen = ({
  navigation,
  route,
}: {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: Route;
}) => {
  const email = route?.params?.email || '';
  const resetToken = route?.params?.resetToken || '';
  const hasValidLink = Boolean(email && resetToken);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetMutation = useResetPassword();

  const handleReset = () => {
    setPasswordError(null);
    setConfirmError(null);
    setFormError(null);

    if (!password) {
      setPasswordError('New password is required');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    resetMutation.mutate(
      { email, resetToken, password },
      {
        onSuccess: () => {
          navigation.navigate('Login', { email } as object);
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
      <ScreenHeader title="Reset password" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {hasValidLink ? (
          <>
            <AppText variant="body" color={theme.color.text.secondary} style={styles.subtitle}>
              Choose a new password for your driver account.
            </AppText>

            <View style={styles.form}>
              <FormInput
                label="New password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={(v: string) => { setPassword(v); setPasswordError(null); }}
                placeholder="••••••••"
                secureTextEntry
                showToggle
              />
              <InlineError message={passwordError} />

              <FormInput
                label="Confirm new password"
                icon="lock-closed-outline"
                value={confirmPassword}
                onChangeText={(v: string) => { setConfirmPassword(v); setConfirmError(null); }}
                placeholder="••••••••"
                secureTextEntry
                showToggle
              />
              <InlineError message={confirmError} />
              <InlineError message={formError} />

              <PrimaryButton
                title="Update password"
                onPress={handleReset}
                loading={resetMutation.isPending}
                style={styles.submitButton}
              />
            </View>
          </>
        ) : (
          <EmptyState
            icon="alert-circle-outline"
            title="Invalid reset link"
            subtitle="This reset link is invalid or expired. Please request a new one."
            actionLabel="Request a new code"
            onAction={() => navigation.navigate('ForgotPassword')}
            fill
          />
        )}
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

export default ResetPasswordScreen;
