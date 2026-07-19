import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

type Props = {
  message?: string | null;
};

export default function InlineError({ message }: Props) {
  if (!message) return null;
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    ...theme.textStyle('label', { weight: 'medium', color: theme.color.danger.text }),
    marginTop: theme.space[1],
  },
});
