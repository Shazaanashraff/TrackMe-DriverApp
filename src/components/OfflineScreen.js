import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const OfflineScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationBlob} />
          <View style={styles.phoneFrame}>
            <View style={styles.phoneScreen}>
              <Ionicons name="cloud-offline-outline" size={42} color={COLORS.error} />
            </View>
            <View style={styles.phoneHome} />
          </View>
        </View>
        <Text style={styles.title}>You&apos;re offline</Text>
        <Text style={styles.subtitle}>Please connect to the internet and try again.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg
  },
  card: {
    width: '100%',
    maxWidth: 380,
    minHeight: 520,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 30,
    elevation: 8
  },
  illustrationWrap: {
    width: 172,
    height: 172,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    position: 'relative'
  },
  illustrationBlob: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 9999,
    backgroundColor: '#fde8e8',
    transform: [{ rotate: '-18deg' }]
  },
  phoneFrame: {
    width: 86,
    height: 146,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1f2937',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 0,
    elevation: 2
  },
  phoneScreen: {
    width: 62,
    height: 104,
    borderRadius: 3,
    backgroundColor: '#f8ecff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111827'
  },
  phoneHome: {
    width: 12,
    height: 12,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#1f2937',
    marginTop: 5,
    backgroundColor: COLORS.white
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.6
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: COLORS.textSecondary,
    maxWidth: 260,
    fontFamily: FONTS.medium
  }
});

export default OfflineScreen;