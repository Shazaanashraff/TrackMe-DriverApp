import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

const LoadingScreen = ({ color = COLORS.primary, backgroundColor = COLORS.background }) => (
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
