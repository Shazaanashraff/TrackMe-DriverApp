import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { startTracking as startTrackingSession, stopTracking } from '../services/socket';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { theme } from '../theme';
import { haversineMeters, totalDistanceMeters, formatElapsed } from '../helpers/geo';
import PrimaryButton from './ui/PrimaryButton';

const MIN_STOP_DISTANCE_METERS = 15;
const MIN_SUBMIT_POINTS = 2;
export const bufferKeyFor = (busId, mode = 'initial') =>
  mode === 'update' ? `active_recording:${busId}:update` : `active_recording:${busId}`;
export const ONBOARDING_DONE_KEY = 'custom_route_onboarding_done';

const WalkthroughableView = walkthroughable(View);

// Map-free driver route recording for custom-route (school/work shuttle) drivers.
// Shows live GPS coordinates + stats instead of a map (locked decision — no map lib
// added to the driver app). Breadcrumb is persisted to AsyncStorage on every fix so a
// killed/backgrounded app can resume, submit, or discard on next launch.
//
// mode="initial" (default) records the route for the first time (POST /record).
// mode="update" re-records an already-ACTIVE route as a candidate for manager
// review (POST /:routeId/record-update) — used for the "Update Route" flow
// after an off-route journey is flagged. Onboarding coach-marks only run in
// "initial" mode since an "update" driver has already recorded before.
const CustomRouteRecorder = ({ bus, routeId, mode = 'initial', onSubmitted }) => {
  const { authenticatedRequest } = useAuth();
  const { start: startCopilotTour, copilotEvents } = useCopilot();
  const busId = bus?.busId || bus?._id;
  const isUpdateMode = mode === 'update';

  const [status, setStatus] = useState('idle'); // idle | recording | submitting
  const [breadcrumbCount, setBreadcrumbCount] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [stopsList, setStopsList] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [namingFix, setNamingFix] = useState(null);
  const [stopNameInput, setStopNameInput] = useState('');

  const breadcrumbRef = useRef([]);
  const stopsRef = useRef([]);
  const startedAtRef = useRef(null);
  const locationSubscription = useRef(null);
  const tickInterval = useRef(null);
  const recordingTourShownRef = useRef(false);
  const activeTourRef = useRef(null); // 'idle' | 'recording' | null
  const tourTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    checkForResumableRecording();
    maybeStartIdleTour();
    return () => {
      mountedRef.current = false;
      if (locationSubscription.current) locationSubscription.current.remove();
      if (tickInterval.current) clearInterval(tickInterval.current);
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId]);

  useEffect(() => {
    const unsubscribe = copilotEvents?.on?.('stop', () => {
      // Only the recording-stage tour (Add Stop + Complete) marks onboarding fully
      // done — finishing the idle-stage tour (Track Route) shouldn't skip it.
      if (activeTourRef.current === 'recording') {
        AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true').catch(() => {});
      }
    });
    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'recording' && !recordingTourShownRef.current) {
      recordingTourShownRef.current = true;
      maybeStartRecordingTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const maybeStartIdleTour = async () => {
    if (isUpdateMode) return; // driver has already been through onboarding
    try {
      const done = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
      if (!done && mountedRef.current) {
        activeTourRef.current = 'idle';
        tourTimeoutRef.current = setTimeout(() => startCopilotTour('trackRoute'), 400);
      }
    } catch (error) {
      // Onboarding is a nice-to-have; never block recording on it.
    }
  };

  const maybeStartRecordingTour = async () => {
    if (isUpdateMode) return;
    try {
      const done = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
      if (!done && mountedRef.current) {
        activeTourRef.current = 'recording';
        tourTimeoutRef.current = setTimeout(() => startCopilotTour('addStop'), 400);
      }
    } catch (error) {
      // Onboarding is a nice-to-have; never block recording on it.
    }
  };

  const persistBuffer = useCallback(async () => {
    if (!busId) return;
    try {
      await AsyncStorage.setItem(
        bufferKeyFor(busId, mode),
        JSON.stringify({ busId, breadcrumb: breadcrumbRef.current, stops: stopsRef.current, startedAt: startedAtRef.current })
      );
    } catch (error) {
      console.warn('Failed to persist recording buffer:', error?.message || error);
    }
  }, [busId]);

  const clearBuffer = useCallback(async () => {
    if (!busId) return;
    await AsyncStorage.removeItem(bufferKeyFor(busId, mode));
  }, [busId]);

  const checkForResumableRecording = async () => {
    if (!busId) return;
    try {
      const raw = await AsyncStorage.getItem(bufferKeyFor(busId, mode));
      if (!raw) return;
      const buffer = JSON.parse(raw);
      if (!buffer?.breadcrumb?.length) {
        await clearBuffer();
        return;
      }
      Alert.alert(
        'Resume recording?',
        `You have an in-progress route recording with ${buffer.breadcrumb.length} GPS points and ${buffer.stops?.length || 0} stops.`,
        [
          { text: 'Discard', style: 'destructive', onPress: () => discardBuffer() },
          { text: 'Submit now', onPress: () => submitRecording(buffer.breadcrumb, buffer.stops || []) },
          { text: 'Resume', onPress: () => resumeRecording(buffer) }
        ]
      );
    } catch (error) {
      console.warn('Failed to read recording buffer:', error?.message || error);
    }
  };

  const discardBuffer = async () => {
    await clearBuffer();
    breadcrumbRef.current = [];
    stopsRef.current = [];
    setBreadcrumbCount(0);
    setStopsList([]);
    setDistanceMeters(0);
    setCurrentLocation(null);
    setStatus('idle');
  };

  const applyFix = (point) => {
    breadcrumbRef.current = [...breadcrumbRef.current, point];
    setCurrentLocation(point);
    setBreadcrumbCount(breadcrumbRef.current.length);
    setDistanceMeters(totalDistanceMeters(breadcrumbRef.current));
    persistBuffer();
  };

  const startWatching = async () => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to record a route');
      return false;
    }

    await startTrackingSession(busId);

    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 3 },
      (location) => {
        const { latitude, longitude } = location.coords;
        applyFix({ lat: latitude, lng: longitude, t: Date.now() });
      }
    );
    return true;
  };

  const startTickTimer = () => {
    if (tickInterval.current) clearInterval(tickInterval.current);
    tickInterval.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 1000);
  };

  const handleStart = async () => {
    breadcrumbRef.current = [];
    stopsRef.current = [];
    startedAtRef.current = Date.now();
    setBreadcrumbCount(0);
    setStopsList([]);
    setDistanceMeters(0);
    setElapsedMs(0);

    const ok = await startWatching();
    if (ok) {
      setStatus('recording');
      startTickTimer();
    }
  };

  const resumeRecording = async (buffer) => {
    breadcrumbRef.current = buffer.breadcrumb;
    stopsRef.current = buffer.stops || [];
    startedAtRef.current = buffer.startedAt || Date.now();
    setBreadcrumbCount(breadcrumbRef.current.length);
    setStopsList(stopsRef.current);
    setDistanceMeters(totalDistanceMeters(breadcrumbRef.current));
    setCurrentLocation(breadcrumbRef.current[breadcrumbRef.current.length - 1] || null);

    const ok = await startWatching();
    if (ok) {
      setStatus('recording');
      startTickTimer();
    }
  };

  const handleAddStop = () => {
    if (!currentLocation) {
      Alert.alert('No location yet', 'Wait for a location update before adding a stop.');
      return;
    }
    const last = stopsRef.current[stopsRef.current.length - 1];
    if (last) {
      const d = haversineMeters(last.lat, last.lng, currentLocation.lat, currentLocation.lng);
      if (d < MIN_STOP_DISTANCE_METERS) {
        Alert.alert('Too close', 'This point is too close to the last stop you added.');
        return;
      }
    }
    setStopNameInput(`Stop ${stopsRef.current.length + 1}`);
    setNamingFix({ lat: currentLocation.lat, lng: currentLocation.lng });
  };

  const confirmStopName = () => {
    if (!namingFix) return;
    const stop = { ...namingFix, stopName: stopNameInput.trim() || `Stop ${stopsRef.current.length + 1}` };
    stopsRef.current = [...stopsRef.current, stop];
    setStopsList(stopsRef.current);
    persistBuffer();
    setNamingFix(null);
    setStopNameInput('');
  };

  const cancelStopName = () => {
    setNamingFix(null);
    setStopNameInput('');
  };

  const stopWatchingAndTimer = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (tickInterval.current) {
      clearInterval(tickInterval.current);
      tickInterval.current = null;
    }
    if (busId) stopTracking(busId);
  };

  const handleCancelRecording = () => {
    Alert.alert('Discard recording?', 'This deletes everything recorded so far.', [
      { text: 'Keep Recording', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { stopWatchingAndTimer(); discardBuffer(); } }
    ]);
  };

  const submitRecording = async (breadcrumb, stops) => {
    if (!breadcrumb || breadcrumb.length < MIN_SUBMIT_POINTS) {
      Alert.alert('Recording too short', 'Please record a longer route before completing.');
      setStatus('idle');
      return;
    }

    setStatus('submitting');
    try {
      const payload = {
        busId,
        breadcrumb: breadcrumb.map((p) => ({ lat: p.lat, lng: p.lng, t: p.t })),
        stops: stops.map((s) => ({ lat: s.lat, lng: s.lng, stopName: s.stopName }))
      };
      if (isUpdateMode) {
        await authenticatedRequest(api.recordRouteUpdate, { routeId, ...payload });
      } else {
        await authenticatedRequest(api.recordCustomRoute, payload);
      }
      await clearBuffer();
      breadcrumbRef.current = [];
      stopsRef.current = [];
      setBreadcrumbCount(0);
      setStopsList([]);
      setDistanceMeters(0);
      setCurrentLocation(null);
      setStatus('idle');
      Alert.alert(
        isUpdateMode ? 'Update sent' : 'Sent to manager',
        isUpdateMode
          ? 'Your route update has been sent to your manager for review.'
          : 'Your recorded route has been sent to your manager for naming.'
      );
      onSubmitted?.();
    } catch (error) {
      Alert.alert('Submit failed', error?.message || 'Could not submit the recorded route. It is still saved on this device.');
      setStatus('recording');
    }
  };

  const handleComplete = async () => {
    stopWatchingAndTimer();
    await submitRecording(breadcrumbRef.current, stopsRef.current);
  };

  if (status === 'idle') {
    return (
      <View style={styles.card} testID="custom-route-recorder">
        <Text style={styles.title}>{isUpdateMode ? 'Update Your Route' : 'Record Your Route'}</Text>
        <Text style={styles.subtitle}>
          {isUpdateMode
            ? "Drive the route again so we can capture the current path. We'll send it to your manager to review."
            : "Drive your route once. We'll track your GPS path — no map needed. Add stops along the way, then send it to your manager to name."}
        </Text>
        <CopilotStep
          name="trackRoute"
          order={1}
          text="Tap here to start recording your route. Drive your usual path — we'll track your GPS in the background."
        >
          <WalkthroughableView>
            <PrimaryButton title="Track Route" onPress={handleStart} testID="track-route-button" />
          </WalkthroughableView>
        </CopilotStep>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="custom-route-recorder">
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="location" size={18} color={COLORS.primary} />
          <Text style={styles.statValue}>
            {currentLocation ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : 'Waiting for GPS…'}
          </Text>
          <Text style={styles.statLabel}>Live Coordinates</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBoxThird}>
          <Text style={styles.statValueSmall}>{stopsList.length}</Text>
          <Text style={styles.statLabel}>Stops</Text>
        </View>
        <View style={styles.statBoxThird}>
          <Text style={styles.statValueSmall}>{(distanceMeters / 1000).toFixed(2)} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statBoxThird}>
          <Text style={styles.statValueSmall}>{formatElapsed(elapsedMs)}</Text>
          <Text style={styles.statLabel}>Elapsed</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <CopilotStep name="addStop" order={1} text="Tap this at each stop along your route (school gate, pickup point, etc).">
          <WalkthroughableView style={styles.actionsRowItem}>
            <TouchableOpacity
              style={[styles.secondaryButton, status === 'submitting' && styles.disabledButton]}
              onPress={handleAddStop}
              disabled={status === 'submitting'}
              testID="add-stop-button"
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.secondaryButtonText}>Add Stop</Text>
            </TouchableOpacity>
          </WalkthroughableView>
        </CopilotStep>

        <CopilotStep name="complete" order={2} text="When you've finished driving the route, tap here to send it to your manager.">
          <WalkthroughableView style={styles.actionsRowItem}>
            <TouchableOpacity
              style={[styles.completeButton, status === 'submitting' && styles.disabledButton]}
              onPress={handleComplete}
              disabled={status === 'submitting'}
              testID="complete-button"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.completeButtonText}>{status === 'submitting' ? 'Submitting…' : 'Complete'}</Text>
            </TouchableOpacity>
          </WalkthroughableView>
        </CopilotStep>
      </View>

      <TouchableOpacity onPress={handleCancelRecording} disabled={status === 'submitting'} testID="cancel-recording-button">
        <Text style={styles.cancelText}>Discard recording</Text>
      </TouchableOpacity>

      <Modal visible={!!namingFix} transparent animationType="fade" onRequestClose={cancelStopName}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Name this stop</Text>
            <TextInput
              style={styles.modalInput}
              value={stopNameInput}
              onChangeText={setStopNameInput}
              placeholder="Stop name"
              testID="stop-name-input"
            />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelStopName} testID="stop-name-cancel">
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmStopName} testID="stop-name-confirm">
                <Text style={styles.modalConfirmText}>Add Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md
  },
  title: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: 10
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.color.surface.tile,
    borderRadius: BORDER_RADIUS.md,
    padding: 12
  },
  statBoxThird: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.color.surface.tile,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10
  },
  statValue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginTop: 6
  },
  statValueSmall: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md
  },
  actionsRowItem: {
    flex: 1
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  completeButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white
  },
  disabledButton: {
    opacity: 0.6
  },
  cancelText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    height: 46,
    fontFamily: FONTS.medium,
    color: COLORS.secondary,
    marginBottom: SPACING.md
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: theme.color.surface.field,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCancelText: {
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  modalConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalConfirmText: {
    fontFamily: FONTS.bold,
    color: COLORS.white
  }
});

export default CustomRouteRecorder;
