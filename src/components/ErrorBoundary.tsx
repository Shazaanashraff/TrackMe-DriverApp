import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

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
          <Ionicons name="warning-outline" size={56} color={theme.color.danger.main} />
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
    padding: theme.space[6],
    gap: theme.space[2],
    backgroundColor: theme.color.surface.page,
  },
  title: {
    ...theme.textStyle('h1', { weight: 'medium', color: theme.color.text.primary }),
    textAlign: 'center',
  },
  subtitle: {
    ...theme.textStyle('label', { color: theme.color.text.secondary }),
    textAlign: 'center',
  },
  button: {
    marginTop: theme.space[1],
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[4],
    backgroundColor: theme.color.primary[500],
    borderRadius: theme.radius.control,
  },
  buttonText: {
    ...theme.textStyle('body', { weight: 'medium', color: theme.color.white }),
  },
});
