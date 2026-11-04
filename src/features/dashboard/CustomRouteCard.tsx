import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';

export type CustomRouteCardProps = {
  status: 'RECORDING' | 'PENDING_REVIEW' | 'ACTIVE';
  acceptedRuns: number;
  requiredRuns: number;
  onDuty: boolean;
  // Live numbers for the ride in progress.
  distanceMeters: number;
  stopCount: number;
  // Name of the stop marked most recently, shown so the driver can see it was kept.
  lastStopName?: string;
  onAddStop: () => void;
  onDiscard: () => void;
  // One line of feedback after tapping Add stop ("Stop added", "Waiting for GPS...").
  notice?: string;
};

const formatDistance = (meters: number) =>
  (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`);

// Shows a custom-route driver where their route is in its setup: "Ride 3 of 5" while
// rides are being recorded, and a waiting message once the manager has it to confirm.
// Nothing for a route that is already live.
export default function CustomRouteCard({
  status, acceptedRuns, requiredRuns, onDuty, distanceMeters, stopCount, lastStopName, onAddStop, onDiscard, notice,
}: CustomRouteCardProps) {
  if (status === 'ACTIVE') return null;

  if (status === 'PENDING_REVIEW') {
    return (
      <View style={styles.card} testID="custom-route-card">
        <View style={styles.headerRow}>
          <View style={styles.iconBadge}>
            <Ionicons name="hourglass-outline" size={18} color={theme.color.primary[600]} />
          </View>
          <View style={styles.headerText}>
            <AppText variant="body" weight="medium">Route sent to your manager</AppText>
            <AppText variant="label" color={theme.color.text.muted}>
              All {requiredRuns} rides are recorded. Your manager will confirm the route.
            </AppText>
          </View>
        </View>
      </View>
    );
  }

  const currentRide = Math.min(acceptedRuns + 1, requiredRuns);

  return (
    <View style={styles.card} testID="custom-route-card">
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="navigate-outline" size={18} color={theme.color.primary[600]} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="body" weight="medium">Setting up your route</AppText>
          <AppText variant="label" color={theme.color.text.muted} testID="custom-route-progress">
            Ride {currentRide} of {requiredRuns}
          </AppText>
        </View>
      </View>

      <View style={styles.pips} accessibilityLabel={`${acceptedRuns} of ${requiredRuns} rides recorded`}>
        {Array.from({ length: requiredRuns }, (_, i) => (
          <View
            key={i}
            testID={`custom-route-pip-${i}`}
            style={[
              styles.pip,
              i < acceptedRuns && styles.pipDone,
              i === acceptedRuns && onDuty && styles.pipCurrent,
            ]}
          />
        ))}
      </View>

      {onDuty ? (
        <>
          <View style={styles.statsRow}>
            <AppText variant="label" color={theme.color.text.secondary} testID="custom-route-distance">
              {formatDistance(distanceMeters)} recorded
            </AppText>
            <AppText variant="label" color={theme.color.text.secondary} testID="custom-route-stops">
              {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
            </AppText>
          </View>
          {lastStopName ? (
            <AppText variant="label" color={theme.color.text.muted} testID="custom-route-last-stop">
              Last stop: {lastStopName}
            </AppText>
          ) : null}
          <PrimaryButton title="Add stop" variant="secondary" onPress={onAddStop} testID="add-stop-button" />
          {notice ? (
            <AppText variant="label" color={theme.color.text.muted} style={styles.notice} testID="custom-route-notice">
              {notice}
            </AppText>
          ) : null}
          <AppText
            variant="label"
            color={theme.color.danger.main}
            style={styles.discard}
            onPress={onDiscard}
            testID="discard-ride-button"
            accessibilityRole="button"
          >
            Discard this ride
          </AppText>
        </>
      ) : (
        <AppText variant="label" color={theme.color.text.muted} style={styles.hint}>
          Go on duty and drive your normal route. Tap Add stop when you pull up at a stop and give it a name, like a student's house. This ride is recorded as you drive.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.white,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.primary[100],
    padding: theme.space[4],
    marginTop: theme.space[4],
    gap: theme.space[3],
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  headerText: { flex: 1 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pips: { flexDirection: 'row', gap: theme.space[2] },
  pip: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.color.primary[100] },
  pipDone: { backgroundColor: theme.color.success.main },
  pipCurrent: { backgroundColor: theme.color.primary[500] },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  notice: { textAlign: 'center' },
  hint: { lineHeight: 18 },
  discard: { textAlign: 'center', paddingVertical: theme.space[1] },
});
