import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    if (__DEV__) console.error('ErrorBoundary caught an error:', error);
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={56} color={COLORS.error} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>The app encountered an unexpected error.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 15,
  },
});
