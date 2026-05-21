import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, FONTS, SPACING, SHADOWS } from '../constants/theme';
import ShiftBusIcon from '../components/ShiftBusIcon';
import FormInput from '../components/ui/FormInput';
import PrimaryButton from '../components/ui/PrimaryButton';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(email, password);
      const { user, accessToken, refreshToken } = response;

      if (user.role !== 'driver') {
        Alert.alert('Error', 'This app is for drivers only');
        return;
      }

      await login(
        { _id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
      );
    } catch (error) {
      if (error?.isBackendConnectionError) {
        return;
      }

      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
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

          <FormInput
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
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
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center'
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl
  },
  logoCircle: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md
  },
  logoText: {
    fontSize: 34,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    letterSpacing: -1
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: SPACING.xs
  },
  subText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 4
  },
  form: {
    width: '100%'
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border
  },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 12,
    fontFamily: FONTS.medium
  },
  hint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.medium,
    opacity: 0.6
  }
});

export default LoginScreen;
