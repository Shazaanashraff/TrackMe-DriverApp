import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const InfoRow = ({ label, value, last = false }) => (
  <View style={[styles.row, !last && styles.rowBorder]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value ?? '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});

export default InfoRow;
