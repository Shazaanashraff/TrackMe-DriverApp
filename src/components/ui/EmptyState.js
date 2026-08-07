import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from './AppText';
import PrimaryButton from './PrimaryButton';

// `fill` makes the state expand and centre itself in whatever space is left, so an
// empty list reads as composed rather than as content stranded at the top of a blank
// screen. Requires the parent to give it room (e.g. contentContainerStyle flexGrow: 1).
const EmptyState = ({ icon = 'alert-circle-outline', title, subtitle, actionLabel, onAction, fill = false, testID, style }) => (
  <View testID={testID} style={[styles.container, fill && styles.fill, style]}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={48} color={theme.color.primary[500]} />
    </View>
    {title ? <AppText variant="h2" style={styles.title}>{title}</AppText> : null}
    {subtitle ? (
      <AppText variant="label" color={theme.color.text.secondary} style={styles.subtitle}>{subtitle}</AppText>
    ) : null}
    {actionLabel && onAction ? (
      <PrimaryButton title={actionLabel} onPress={onAction} style={styles.action} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space[8],
    paddingHorizontal: theme.space[5],
  },
  fill: {
    flex: 1,
    // Sits a touch above true centre; dead-centre reads as low on a tall phone.
    paddingBottom: theme.space[8],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: theme.space[4],
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.space[1],
    textAlign: 'center',
  },
  action: {
    marginTop: theme.space[4],
    minWidth: 160,
  },
});

export default EmptyState;
