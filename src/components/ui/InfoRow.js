import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from './AppText';

const InfoRow = ({ label, value, last = false }) => (
  <View style={[styles.row, !last && styles.rowBorder]}>
    <AppText variant="label" color={theme.color.text.secondary} style={styles.label}>{label}</AppText>
    <AppText variant="body" style={styles.value}>{value ?? '-'}</AppText>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.space[3],
  },
  rowBorder: {
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.color.border.hairline,
  },
  label: {
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
});

export default InfoRow;
