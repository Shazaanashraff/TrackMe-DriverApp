import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

type Props = {
  message?: string | null;
};

export default function InlineError({ message }: Props) {
  if (!message) return null;
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: FONTS.medium,
    color: COLORS.error,
    fontSize: 13,
    marginTop: 4,
  },
});
