import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const LoadingScreen = ({ color = theme.color.primary[500], backgroundColor = theme.color.surface.page }) => (
  <View style={[styles.container, { backgroundColor }]}>
    <ActivityIndicator size="large" color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingScreen;
