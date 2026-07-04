import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLogin } from '../hooks/auth';
import { AppError, normalizeError } from '../lib/errors';
import { COLORS, FONTS, SPACING, SHADOWS } from '../constants/theme';
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            <ShiftBusIcon size={56} />
          </View>
          <Text style={styles.logoText}>TrackMe</Text>
          <Text style={styles.welcomeText}>Driver Portal</Text>
          <Text style={styles.subText}>Manage your journeys with ease</Text>
        </View>

        <View style={styles.form}>
          <FormInput
            label="Email Address"
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

          {login.isError && (
            <ErrorState error={asAppError(login.error)} variant="compact" />
          )}

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={login.isPending}
            style={styles.loginButton}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Trusted by thousands</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.hint}>Testing credentials: driver@test.com / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  logoText: {
    fontSize: 34,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    letterSpacing: -1,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: SPACING.xs,
  },
  subText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  hint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.medium,
    opacity: 0.6,
  },
});

export default LoginScreen;
