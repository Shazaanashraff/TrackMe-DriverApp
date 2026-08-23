import React from 'react';
import { StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from './AppText';

type Props = {
  children: React.ReactNode;
  testID?: string;
};

// Sits under a disabled action while offline. Deliberately amber (warning.main),
// not the red an InlineError/ErrorState uses — offline isn't wrong, it's just
// waiting for a connection.
export default function OfflineActionNote({ children, testID }: Props) {
  return (
    <AppText variant="caption" color={theme.color.warning.main} style={styles.text} testID={testID}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  text: {
    marginTop: theme.space[2],
    textAlign: 'center',
  },
});
