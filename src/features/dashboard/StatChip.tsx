import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';

type Props = {
  value: string;
  label: string;
  testID?: string;
};

export default function StatChip({ value, label, testID }: Props) {
  return (
    <View style={styles.chip} testID={testID}>
      <AppText variant="h2" onInk style={styles.value}>{value}</AppText>
      <AppText variant="overline" color={theme.color.primary[300]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: theme.color.ink.raised,
    borderRadius: 10,
    paddingVertical: theme.space[2] + 2,
    paddingHorizontal: theme.space[3],
  },
  value: {
    marginBottom: theme.space[1],
  },
});
