import React, { useState } from 'react';
import { View, ScrollView, StatusBar, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useLogin } from '../hooks/auth';
import { AppError, normalizeError } from '../lib/errors';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import ShiftBusIcon from '../components/ShiftBusIcon';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import InlineError from '../components/ui/InlineError';
import ErrorState from '../components/ui/ErrorState';

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : normalizeError(error);
}

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const login = useLogin();

  const handleLogin = () => {
    setEmailError(null);
    setPasswordError(null);

    let hasError = false;
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }
    if (hasError) return;

    login.mutate({ email, password });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ShiftBusIcon size={56} />
          <AppText variant="h1" onInk style={styles.appName}>TrackMe</AppText>
          <AppText variant="label" color={theme.color.primary[300]}>Drive. Go live. Get paid.</AppText>
        </View>

        <View style={styles.form}>
          <FormInput
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="driver@test.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InlineError message={emailError} />

          <FormInput
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <InlineError message={passwordError} />

          {login.isError && <ErrorState error={asAppError(login.error)} variant="compact" />}

          <PrimaryButton title="Sign in" onPress={handleLogin} loading={login.isPending} style={styles.loginButton} />
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
  hero: {
    height: '35%',
    minHeight: 220,
    backgroundColor: theme.color.ink.base,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.space[5],
  },
  appName: {
    marginTop: theme.space[1],
  },
  form: {
    padding: theme.space[5],
    paddingTop: theme.space[6],
  },
  loginButton: {
    marginTop: theme.space[2],
  },
});

export default LoginScreen;
