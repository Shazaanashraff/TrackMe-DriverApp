import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const ScreenHeader = ({ title, onBack, rightElement, style }) => (
  <View style={[styles.header, style]}>
    {onBack ? (
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={COLORS.secondary} />
      </TouchableOpacity>
    ) : (
      <View style={styles.placeholder} />
    )}
    <Text style={styles.title}>{title}</Text>
    <View style={styles.placeholder}>{rightElement}</View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
});

export default ScreenHeader;
