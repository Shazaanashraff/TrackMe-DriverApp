import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import PermissionDeniedState from '../../components/PermissionDeniedState';
import GoButton from './GoButton';
import StatChip from './StatChip';
import { deriveDutyHeroState, gpsQualityLabel } from './dutyHeroState';
import { formatElapsed } from '../../helpers/geo';
import { TrackingStatus } from '../../hooks/useTrackingSession';
import { LocationPermissionStatus } from '../../hooks/useLocationBroadcast';
import { LocationFix } from '../../helpers/locationUtils';

type Props = {
  firstName?: string;
  vehicleName?: string;
  status: TrackingStatus;
  isReconnecting: boolean;
  connecting: boolean;
  permission: LocationPermissionStatus;
  lastFix: LocationFix | null;
  hasVehicle: boolean;
  hadVehicleBefore: boolean;
  lostConnection?: boolean;
  // Unsent GPS fixes still sitting in locationDispatch's buffer. >0 means
  // updates aren't currently reaching the server — shown in place of
  // "updates sent" since the two can't both be true at once.
  bufferedCount?: number;
  onGoPress: () => void;
  onEndPress: () => void;
};

function LiveDot({ color, pulsing }: { color: string; pulsing: boolean }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!pulsing) {
      opacity.setValue(1);
      return undefined;
    }

    let isMounted = true;
    let loop: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted || reduceMotion) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: theme.motion.pulseMs / 2, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: theme.motion.pulseMs / 2, useNativeDriver: true }),
        ])
      );
      loop.start();
    });

    return () => {
      isMounted = false;
      loop?.stop();
    };
  }, [pulsing, opacity]);

  return <Animated.View testID="live-dot" style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

export default function DutyHero({
  firstName,
  vehicleName,
  status,
  isReconnecting,
  connecting,
  permission,
  lastFix,
  hasVehicle,
  hadVehicleBefore,
  lostConnection = false,
  bufferedCount = 0,
  onGoPress,
  onEndPress,
}: Props) {
  const isLive = status === 'tracking';
  // A pending (offline-started) shift is on duty for every UI purpose here — the
  // timer runs, the stats row shows, GO reads END — it just isn't green.
  const onDuty = isLive || status === 'pending';
  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [updatesSent, setUpdatesSent] = useState(0);
  const lastFixTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (onDuty && startedAt == null) {
      setStartedAt(Date.now());
    } else if (!onDuty && startedAt != null) {
      setStartedAt(null);
      setUpdatesSent(0);
      lastFixTimestampRef.current = null;
    }
  }, [onDuty, startedAt]);

  useEffect(() => {
    if (!onDuty) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [onDuty]);

  useEffect(() => {
    if (!onDuty || !lastFix) return;
    if (lastFixTimestampRef.current === lastFix.timestamp) return;
    lastFixTimestampRef.current = lastFix.timestamp;
    setUpdatesSent((count) => count + 1);
  }, [onDuty, lastFix]);

  const secondsSinceFix =
    onDuty && lastFix ? Math.max(0, Math.floor((now - lastFix.timestamp) / 1000)) : null;

  const state = deriveDutyHeroState({
    status,
    isReconnecting,
    connecting,
    permission,
    hasVehicle,
    hadVehicleBefore,
    secondsSinceFix,
    lostConnection,
  });

  const dotColor =
    state.dot === 'on' ? theme.color.duty.on : state.dot === 'warn' ? theme.color.duty.warn : theme.color.duty.off;

  const greeting = `Hi ${firstName || 'Driver'}${vehicleName ? ` · ${vehicleName}` : ''}`;
  const timeOnline = startedAt != null ? formatElapsed(now - startedAt) : '00:00';
  const gps = gpsQualityLabel(lastFix?.accuracy);

  return (
    <View style={styles.hero}>
      <AppText variant="label" color={theme.color.primary[300]}>{greeting}</AppText>

      {/* The headline owns a full-width line of its own. Sharing a row with the GO
          control wrapped the display type mid-phrase on a 390dp screen. */}
      <AppText variant="display" onInk style={styles.headline}>{state.headline}</AppText>

      <View style={styles.mainRow}>
        <View style={styles.statusColumn}>
          <View style={styles.sublineRow}>
            <LiveDot color={dotColor} pulsing={state.dot === 'on'} />
            {!state.showAllowLocation ? (
              <AppText variant="label" color={theme.color.primary[300]} style={styles.sublineText}>
                {state.subline}
              </AppText>
            ) : null}
          </View>
          {state.showAllowLocation ? <PermissionDeniedState /> : null}
        </View>
        <GoButton
          isLive={onDuty}
          disabled={state.goDisabled}
          busy={status === 'starting'}
          onPress={onDuty ? onEndPress : onGoPress}
        />
      </View>

      {onDuty ? (
        <View style={styles.statsRow}>
          <StatChip value={timeOnline} label="time online" />
          {bufferedCount > 0 ? (
            <StatChip value={String(bufferedCount)} label="saved, not sent" testID="buffered-count-chip" />
          ) : (
            <StatChip value={String(updatesSent)} label="updates sent" />
          )}
          <StatChip value={gps} label="GPS" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: theme.color.ink.base,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: theme.space[5],
    paddingTop: theme.space[5],
    paddingBottom: theme.space[6],
  },
  headline: {
    marginTop: theme.space[3],
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space[3],
    gap: theme.space[4],
  },
  statusColumn: {
    flex: 1,
  },
  sublineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sublineText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.space[2],
    marginTop: theme.space[5],
  },
});
