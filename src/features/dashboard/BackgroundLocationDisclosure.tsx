import React, { useContext } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';

type Props = {
  visible: boolean;
  onAllow: () => void;
  onDismiss: () => void;
  loading?: boolean;
};

// Google Play requires this disclosure to appear BEFORE the system background
// location prompt, and to name the data, the background collection, and the
// purpose. Do not fold it into the OS dialog or show it afterwards.
export default function BackgroundLocationDisclosure({
  visible,
  onAllow,
  onDismiss,
  loading = false,
}: Props) {
  // The build is edge-to-edge, so the sheet draws behind Android's back/home bar
  // and its "Not now" button sat partly under it. The inset is read from context
  // directly because tests render the sheet without a SafeAreaProvider.
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View
          testID="background-disclosure-sheet"
          style={[styles.sheet, { paddingBottom: Math.max(theme.space[8], theme.space[5] + bottomInset) }]}
        >
          <AppText variant="h2">Keep sharing when your screen is off</AppText>
          <AppText variant="label" color={theme.color.text.secondary} style={styles.body}>
            Pingo collects this vehicle&apos;s location, including while the app is closed or
            not in use, so your passengers and your manager can see where the vehicle is for the
            whole journey.
          </AppText>
          <AppText variant="label" color={theme.color.text.secondary} style={styles.body}>
            Location is only collected while you are on duty. It stops the moment you end the
            journey.
          </AppText>
          <PrimaryButton
            testID="background-disclosure-allow"
            title="Continue"
            onPress={onAllow}
            loading={loading}
            style={styles.allowButton}
          />
          <PrimaryButton
            testID="background-disclosure-dismiss"
            title="Not now"
            variant="secondary"
            onPress={onDismiss}
            disabled={loading}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface.card,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    padding: theme.space[5],
    ...theme.elevation.sheet,
  },
  body: {
    marginTop: theme.space[3],
  },
  allowButton: {
    marginTop: theme.space[5],
    marginBottom: theme.space[3],
  },
});
