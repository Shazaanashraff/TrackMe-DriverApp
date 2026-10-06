import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ui/ScreenHeader';

// Drivers are created by their transport manager and sign in with a Driver ID; most
// have no email on their account, so an emailed reset code could never reach them.
// The manager resets the password from WebAdmin (Drivers › Reset password) instead.
const ForgotPasswordScreen = ({ navigation }: { navigation: { goBack: () => void } }) => (
  <View style={styles.container}>
    <StatusBar barStyle="dark-content" />
    <ScreenHeader title="Forgot password" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.iconBadge}>
        <Ionicons name="key-outline" size={24} color={theme.color.primary[600]} />
      </View>
      <AppText variant="h2" color={theme.color.text.primary} style={styles.title}>
        Forgot your password?
      </AppText>
      <AppText variant="body" color={theme.color.text.secondary}>
        Your transport manager can reset it for you. Contact them for a new password.
      </AppText>
      <PrimaryButton
        title="Back to sign in"
        onPress={() => navigation.goBack()}
        style={styles.button}
      />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  content: {
    flexGrow: 1,
    padding: theme.space[5],
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space[4],
  },
  title: {
    marginBottom: theme.space[2],
  },
  button: {
    marginTop: theme.space[6],
  },
});

export default ForgotPasswordScreen;
