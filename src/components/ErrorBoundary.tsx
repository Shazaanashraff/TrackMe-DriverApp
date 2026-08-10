import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
          {__DEV__ && this.state.error ? (
            <ScrollView style={styles.devBox} contentContainerStyle={{ padding: theme.space[2] }}>
              <Text selectable style={styles.devText}>{String(this.state.error?.message || this.state.error)}</Text>
              <Text selectable style={styles.devStack}>{String(this.state.error?.stack || '').slice(0, 1200)}</Text>
            </ScrollView>
          ) : null}
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
  devBox: {
    maxHeight: 260,
    alignSelf: 'stretch',
    marginTop: theme.space[3],
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.border.hairline,
  },
  devText: {
    fontFamily: theme.fontFamily('bold'),
    fontSize: 12,
    color: theme.color.danger.main,
  },
  devStack: {
    fontFamily: theme.fontFamily('medium'),
    fontSize: 10,
    color: theme.color.text.secondary,
    marginTop: theme.space[1],
  },
});
