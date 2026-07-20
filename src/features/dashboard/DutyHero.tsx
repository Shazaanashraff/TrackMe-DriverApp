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
  busName?: string;
  status: TrackingStatus;
  isReconnecting: boolean;
  connecting: boolean;
  permission: LocationPermissionStatus;
  lastFix: LocationFix | null;
  hasBus: boolean;
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
  busName,
  status,
  isReconnecting,
  connecting,
  permission,
  lastFix,
  hasBus,
  onGoPress,
  onEndPress,
}: Props) {
  const isLive = status === 'tracking';
  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [updatesSent, setUpdatesSent] = useState(0);
  const lastFixTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLive && startedAt == null) {
      setStartedAt(Date.now());
    } else if (!isLive && startedAt != null) {
      setStartedAt(null);
      setUpdatesSent(0);
      lastFixTimestampRef.current = null;
    }
  }, [isLive, startedAt]);

  useEffect(() => {
    if (!isLive) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    if (!isLive || !lastFix) return;
    if (lastFixTimestampRef.current === lastFix.timestamp) return;
    lastFixTimestampRef.current = lastFix.timestamp;
    setUpdatesSent((count) => count + 1);
  }, [isLive, lastFix]);

  const secondsSinceFix =
    isLive && lastFix ? Math.max(0, Math.floor((now - lastFix.timestamp) / 1000)) : null;

  const state = deriveDutyHeroState({
    status,
    isReconnecting,
    connecting,
    permission,
    hasBus,
    secondsSinceFix,
  });

  const dotColor =
    state.dot === 'on' ? theme.color.duty.on : state.dot === 'warn' ? theme.color.duty.warn : theme.color.duty.off;

  const greeting = `Hi ${firstName || 'Driver'}${busName ? ` · ${busName}` : ''}`;
  const timeOnline = startedAt != null ? formatElapsed(now - startedAt) : '00:00';
  const gps = gpsQualityLabel(lastFix?.accuracy);

  return (
    <View style={styles.hero}>
      <AppText variant="label" color={theme.color.primary[300]}>{greeting}</AppText>

      <View style={styles.mainRow}>
        <View style={styles.statusColumn}>
          <AppText variant="display" onInk>{state.headline}</AppText>
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
          isLive={isLive}
          disabled={state.goDisabled}
          busy={status === 'starting'}
          onPress={isLive ? onEndPress : onGoPress}
        />
      </View>

      {isLive ? (
        <View style={styles.statsRow}>
          <StatChip value={timeOnline} label="time online" />
          <StatChip value={String(updatesSent)} label="updates sent" />
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
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: theme.space[4],
    gap: theme.space[3],
  },
  statusColumn: {
    flex: 1,
  },
  sublineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.space[2],
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
