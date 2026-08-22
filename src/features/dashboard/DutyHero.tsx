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
      {/* Background Radar Rings anchoring the GO button on the right */}
      <View style={styles.radarRingOuter} />
      <View style={styles.radarRingInner} />

      {/* Top Context Bar */}
      <View style={styles.contextBar}>
        <View style={styles.contextPill}>
          <AppText variant="caption" color={theme.color.primary[100]} weight="medium">
            {firstName || 'Driver'}
          </AppText>
        </View>
        {vehicleName ? (
          <View style={styles.contextPill}>
            <AppText variant="caption" color={theme.color.primary[100]} weight="medium">
              {vehicleName}
            </AppText>
          </View>
        ) : null}
      </View>

      {/* Asymmetric Split Layout */}
      <View style={styles.splitLayout}>
        <View style={styles.textColumn}>
          <AppText variant="h1" onInk style={styles.headline}>
            {state.headline}
          </AppText>
          <View style={styles.statusPill}>
            <LiveDot color={dotColor} pulsing={state.dot === 'on'} />
            {!state.showAllowLocation ? (
              <AppText variant="caption" color={theme.color.primary[300]} style={styles.sublineText}>
                {state.subline}
              </AppText>
            ) : null}
          </View>
          {state.showAllowLocation ? (
            <View style={{ marginTop: theme.space[2] }}>
              <PermissionDeniedState />
            </View>
          ) : null}
        </View>
        
        <View style={styles.buttonColumn}>
          <GoButton
            isLive={isLive}
            disabled={state.goDisabled}
            busy={status === 'starting'}
            onPress={isLive ? onEndPress : onGoPress}
          />
        </View>
      </View>

      {/* Sleek unified stats HUD strip */}
      {isLive ? (
        <View style={styles.hudStrip}>
          <View style={styles.hudItem}>
            <AppText variant="overline" color={theme.color.primary[300]}>TIME</AppText>
            <AppText variant="body" onInk weight="medium">{timeOnline}</AppText>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudItem}>
            <AppText variant="overline" color={theme.color.primary[300]}>UPDATES</AppText>
            <AppText variant="body" onInk weight="medium">{updatesSent}</AppText>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudItem}>
            <AppText variant="overline" color={theme.color.primary[300]}>GPS</AppText>
            <AppText variant="body" onInk weight="medium">{gps}</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: theme.color.ink.base,
    borderRadius: 24,
    padding: theme.space[4],
    marginHorizontal: 0,
    marginBottom: theme.space[5],
    overflow: 'hidden',
    ...theme.elevation.card,
    shadowColor: theme.color.ink.base,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
  },
  radarRingOuter: {
    position: 'absolute',
    right: -40,
    top: 20,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  radarRingInner: {
    position: 'absolute',
    right: 10,
    top: 70,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  contextBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.space[5],
    zIndex: 1,
  },
  contextPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[1],
    borderRadius: theme.radius.pill,
  },
  splitLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  textColumn: {
    flex: 1,
    paddingRight: theme.space[3],
  },
  headline: {
    marginBottom: theme.space[3],
    lineHeight: 28,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[2],
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    gap: theme.space[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sublineText: {
    letterSpacing: 0.2,
  },
  buttonColumn: {
    alignItems: 'flex-end',
  },
  hudStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.color.ink.raised,
    borderRadius: 16,
    marginTop: theme.space[5],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    zIndex: 1,
  },
  hudItem: {
    alignItems: 'center',
    flex: 1,
  },
  hudDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
