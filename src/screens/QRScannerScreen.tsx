import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, SafeAreaView, StatusBar, StyleSheet, Linking, Pressable, ActivityIndicator } from 'react-native';
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

// Secondary action on the ink surface. PrimaryButton's `secondary` variant is a light
// field colour built for white screens, so it would read as a bright slab on navy.
function InkGhostButton({ title, onPress, testID }: { title: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.ghostButton, pressed && styles.ghostButtonPressed]}
    >
      <AppText variant="body" weight="medium" onInk>{title}</AppText>
    </Pressable>
  );
}

// Shown only on the settings path, where the OS will not prompt again and the driver
// has to find the toggle themselves.
const SETTINGS_STEPS = ['Open settings', 'Turn on Camera', 'Come back and scan'];

function CameraPermissionDeniedState({
  canAskAgain,
  onRequestPermission,
  onOpenSettings,
  onGoBack,
}: {
  canAskAgain: boolean;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
  onGoBack: () => void;
}) {
  return (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionBlock}>
        <View style={styles.permissionIconCircle}>
          <Ionicons name="camera-outline" size={40} color={theme.color.primary[100]} />
        </View>

        <AppText variant="h2" onInk style={styles.permissionTitle}>Camera access needed</AppText>
        <AppText variant="label" color={theme.color.primary[300]} style={styles.permissionSubtitle}>
          {canAskAgain
            ? 'TrackMe uses the camera to read rider QR passes. Nothing is recorded.'
            : 'Camera access is turned off for TrackMe. Turn it on in settings to scan rider passes.'}
        </AppText>

        {canAskAgain ? null : (
          <View style={styles.stepsCard} testID="permission-steps">
            {SETTINGS_STEPS.map((step, index) => (
              <View key={step} style={[styles.stepRow, index > 0 && styles.stepRowDivided]}>
                <View style={styles.stepBadge}>
                  <AppText variant="caption" weight="medium" color={theme.color.primary[300]}>
                    {String(index + 1)}
                  </AppText>
                </View>
                <AppText variant="label" onInk style={styles.stepLabel}>{step}</AppText>
              </View>
            ))}
          </View>
        )}

        <View style={styles.permissionActions}>
          {canAskAgain ? (
            <>
              <PrimaryButton title="Allow camera" onPress={onRequestPermission} testID="permission-primary" />
              <InkGhostButton title="Open settings" onPress={onOpenSettings} testID="permission-secondary" />
            </>
          ) : (
            <>
              <PrimaryButton title="Open settings" onPress={onOpenSettings} testID="permission-primary" />
              <InkGhostButton title="Go back" onPress={onGoBack} testID="permission-secondary" />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function feedbackFor(status: string, lastResult: ReturnType<typeof useBoardingScan>['lastResult'], errorMessage: string | null) {
  if (status === 'success') {
    const name = lastResult?.studentName;
    const riderCode = lastResult?.riderCode;
    const type = lastResult?.type;
    const time = lastResult?.timestamp ? new Date(lastResult.timestamp).toLocaleTimeString() : '';
    return {
      variant: 'success' as const,
      message: [name, riderCode, type, time].filter(Boolean).join(' · ') || 'Scan recorded',
    };
  }
  if (status === 'debounced') {
    return { variant: 'neutral' as const, message: [lastResult?.studentName, lastResult?.riderCode, 'Already recorded'].filter(Boolean).join(' · ') };
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
      <ScreenHeader title="Scan rider QR" onBack={() => navigation.goBack()} onInk />

      {!permission ? (
        <View style={styles.permissionContainer} testID="permission-resolving">
          <ActivityIndicator color={theme.color.primary[500]} />
        </View>
      ) : !permission.granted ? (
        <CameraPermissionDeniedState
          canAskAgain={permission.canAskAgain !== false}
          onRequestPermission={requestPermission}
          onOpenSettings={() => Linking.openSettings()}
          onGoBack={() => navigation.goBack()}
        />
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
  // Caps the measure so the copy does not stretch into long lines on tablets and web.
  permissionBlock: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  permissionIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.color.ink.raised,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.ink.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    marginTop: theme.space[5],
    textAlign: 'center',
  },
  permissionSubtitle: {
    marginTop: theme.space[2],
    textAlign: 'center',
    lineHeight: 20,
  },
  stepsCard: {
    alignSelf: 'stretch',
    marginTop: theme.space[6],
    backgroundColor: theme.color.ink.raised,
    borderRadius: theme.radius.card,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.ink.line,
    paddingHorizontal: theme.space[4],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
  },
  stepRowDivided: {
    borderTopWidth: theme.borderWidth.hairline,
    borderTopColor: theme.color.ink.line,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.color.ink.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    flex: 1,
  },
  permissionActions: {
    alignSelf: 'stretch',
    marginTop: theme.space[6],
    gap: theme.space[2],
  },
  ghostButton: {
    height: 52,
    borderRadius: theme.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.ink.line,
  },
  ghostButtonPressed: {
    backgroundColor: theme.color.ink.raised,
  },
});

export default QRScannerScreen;
