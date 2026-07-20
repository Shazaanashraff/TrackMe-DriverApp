import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from './AppText';

const ScreenHeader = ({ title, onBack, rightElement, style }) => (
  <View style={[styles.header, style]}>
    {onBack ? (
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={24} color={theme.color.text.primary} />
      </TouchableOpacity>
    ) : (
      <View style={styles.placeholder} />
    )}
    <AppText variant="h1" style={styles.title} numberOfLines={1}>{title}</AppText>
    {rightElement ? <View style={styles.right}>{rightElement}</View> : <View style={styles.placeholder} />}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space[5],
    paddingVertical: theme.space[4],
    gap: theme.space[2],
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  placeholder: {
    width: 44,
  },
  title: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
});

export default ScreenHeader;
