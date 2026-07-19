import React, { useCallback, useRef, useState } from 'react';
import { View, SafeAreaView, StatusBar, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import ScreenHeader from '../components/ui/ScreenHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useBoardingScan } from '../features/boarding/useBoardingScan';

type Props = {
  navigation: { goBack: () => void };
  route: { params?: { busId?: string } };
};

function CameraPermissionDeniedState({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionIconCircle}>
        <Ionicons name="camera-outline" size={48} color={theme.color.primary[500]} />
      </View>
      <AppText variant="h2" style={styles.permissionTitle}>Camera access needed</AppText>
      <AppText variant="label" color={theme.color.text.secondary} style={styles.permissionSubtitle}>
        Allow camera access so you can scan rider QR passes.
      </AppText>
      <PrimaryButton title="Open settings" onPress={onOpenSettings} style={styles.permissionAction} />
    </View>
  );
}

function feedbackFor(status: string, lastResult: ReturnType<typeof useBoardingScan>['lastResult'], errorMessage: string | null) {
  if (status === 'success') {
    const name = lastResult?.studentName;
    const type = lastResult?.type;
    const time = lastResult?.timestamp ? new Date(lastResult.timestamp).toLocaleTimeString() : '';
    return {
      variant: 'success' as const,
      message: [name, type, time].filter(Boolean).join(' · ') || 'Scan recorded',
    };
  }
  if (status === 'debounced') {
    return { variant: 'neutral' as const, message: 'Already recorded' };
  }
  if (status === 'error') {
    return { variant: 'error' as const, message: errorMessage || 'Something went wrong. Please try again.' };
  }
  return null;
}

const QRScannerScreen = ({ navigation, route }: Props) => {
  const busId = route?.params?.busId || '';
  const [permission, requestPermission] = useCameraPermissions();
  const { status, lastResult, errorMessage, submitScan } = useBoardingScan(busId);
  const scanLockRef = useRef(false);

  const [permissionRequested, setPermissionRequested] = useState(false);

  React.useEffect(() => {
    if (!permission) return;
    if (!permission.granted && !permissionRequested) {
      setPermissionRequested(true);
      requestPermission();
    }
  }, [permission, permissionRequested, requestPermission]);

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;
      submitScan(data);
      setTimeout(() => {
        scanLockRef.current = false;
      }, 3000);
    },
    [submitScan]
  );

  const feedback = feedbackFor(status, lastResult, errorMessage);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScreenHeader title="Scan rider QR" onBack={() => navigation.goBack()} />

      {!permission || !permission.granted ? (
        <CameraPermissionDeniedState onOpenSettings={() => Linking.openSettings()} />
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={status === 'scanning' ? undefined : handleScan}
          />
          <View pointerEvents="none" style={styles.viewfinderWrap}>
            <View style={styles.viewfinder} />
          </View>

          {feedback ? (
            <View style={[styles.feedbackBanner, styles[`feedback_${feedback.variant}`]]} testID="scan-feedback">
              <AppText variant="body" weight="medium" color={theme.color.white}>
                {feedback.message}
              </AppText>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.ink.base,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  viewfinderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderRadius: theme.radius.card,
    borderWidth: 3,
    borderColor: theme.color.white,
    opacity: 0.85,
  },
  feedbackBanner: {
    position: 'absolute',
    left: theme.space[4],
    right: theme.space[4],
    bottom: theme.space[6],
    borderRadius: theme.radius.card,
    paddingVertical: theme.space[4],
    paddingHorizontal: theme.space[4],
    alignItems: 'center',
  },
  feedback_success: {
    backgroundColor: theme.color.success.main,
  },
  feedback_neutral: {
    backgroundColor: theme.color.text.secondary,
  },
  feedback_error: {
    backgroundColor: theme.color.danger.main,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[5],
  },
  permissionIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    marginTop: theme.space[4],
    textAlign: 'center',
    color: theme.color.white,
  },
  permissionSubtitle: {
    marginTop: theme.space[1],
    textAlign: 'center',
  },
  permissionAction: {
    marginTop: theme.space[4],
    minWidth: 200,
  },
});

export default QRScannerScreen;
