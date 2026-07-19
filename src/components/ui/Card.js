import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from './AppText';

const Card = ({ title, children, style, padding = theme.space[4], ...rest }) => (
  <View style={[styles.card, { padding }, style]} {...rest}>
    {title ? <AppText variant="h2" style={styles.title}>{title}</AppText> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.border.hairline,
  },
  title: {
    marginBottom: theme.space[2],
  },
});

export default Card;
