import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  route: { params?: { vehicleId?: string } };
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
  const vehicleId = route?.params?.vehicleId || '';
  const [permission, requestPermission] = useCameraPermissions();
  const { status, lastResult, errorMessage, submitScan } = useBoardingScan(vehicleId);
  const scanLockRef = useRef(false);
  // A different rider's scan landing mid-cooldown is queued here rather than
  // dropped, and fired the moment the cooldown clears (issue #11).
  const pendingScanRef = useRef<string | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCooldownHint, setShowCooldownHint] = useState(false);

  const [permissionRequested, setPermissionRequested] = useState(false);

  React.useEffect(() => {
    if (!permission) return;
    if (!permission.granted && !permissionRequested) {
      setPermissionRequested(true);
      requestPermission();
    }
  }, [permission, permissionRequested, requestPermission]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  // Routed through a ref rather than a direct self-reference so fireScan can
  // schedule its own replay from inside the setTimeout callback below.
  const fireScanRef = useRef<(data: string) => void>(() => {});

  const fireScan = useCallback(
    (data: string) => {
      scanLockRef.current = true;
      setShowCooldownHint(false);
      submitScan(data);
      cooldownTimerRef.current = setTimeout(() => {
        scanLockRef.current = false;
        const queued = pendingScanRef.current;
        pendingScanRef.current = null;
        if (queued) {
          fireScanRef.current(queued);
        } else {
          setShowCooldownHint(false);
        }
      }, 3000);
    },
    [submitScan]
  );

  useEffect(() => {
    fireScanRef.current = fireScan;
  }, [fireScan]);

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      if (scanLockRef.current) {
        pendingScanRef.current = data;
        setShowCooldownHint(true);
        return;
      }
      fireScan(data);
    },
    [fireScan]
  );

  const feedback = showCooldownHint
    ? { variant: 'neutral' as const, message: 'Please wait a moment — recording the last scan' }
    : feedbackFor(status, lastResult, errorMessage);

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
