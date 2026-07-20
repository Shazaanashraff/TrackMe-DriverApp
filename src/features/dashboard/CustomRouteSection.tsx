import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CopilotProvider } from 'react-native-copilot';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import PrimaryButton from '../../components/ui/PrimaryButton';
import CustomRouteRecorder from '../../components/CustomRouteRecorder';

type CustomRoute = {
  isCustomRoute?: boolean;
  status?: string;
  stopsCount?: number;
  distance?: number;
  routeId?: string;
  hasPendingChangeRequest?: boolean;
} | null;

type Props = {
  bus: unknown;
  customRoute: CustomRoute;
  showUpdateRecorder: boolean;
  onShowUpdateRecorder: () => void;
  onRecorderSubmitted: () => void;
};

export default function CustomRouteSection({
  bus,
  customRoute,
  showUpdateRecorder,
  onShowUpdateRecorder,
  onRecorderSubmitted,
}: Props) {
  const isPendingCustomRoute =
    customRoute?.isCustomRoute && customRoute?.status === 'PENDING_NAMING';
  const isRecordedAwaitingNaming = isPendingCustomRoute && (customRoute?.stopsCount || 0) > 0;
  const isActiveCustomRoute = customRoute?.isCustomRoute && customRoute?.status === 'ACTIVE';
  const showBanner = !!(isActiveCustomRoute && customRoute?.hasPendingChangeRequest && !showUpdateRecorder);

  const hasContent = isRecordedAwaitingNaming || isPendingCustomRoute || showUpdateRecorder || showBanner;
  if (!hasContent) return null;

  return (
    <View>
      <AppText variant="h2" style={styles.title}>Your route</AppText>

      {isRecordedAwaitingNaming ? (
        <Card testID="custom-route-pending-naming" style={styles.card}>
          <View style={styles.headerRow}>
            <Ionicons name="time-outline" size={20} color={theme.color.text.secondary} style={styles.headerIcon} />
            <AppText variant="body" weight="medium">Awaiting manager naming</AppText>
          </View>
          <AppText variant="label" color={theme.color.text.secondary} style={styles.subtitle}>
            Your recorded route ({customRoute?.stopsCount} stops, {customRoute?.distance ?? 0} km)
            has been sent to your manager. You'll be able to start journeys once it's named.
          </AppText>
        </Card>
      ) : isPendingCustomRoute ? (
        <CopilotProvider>
          <CustomRouteRecorder bus={bus} onSubmitted={onRecorderSubmitted} />
        </CopilotProvider>
      ) : showUpdateRecorder ? (
        <CopilotProvider>
          <CustomRouteRecorder
            bus={bus}
            routeId={customRoute?.routeId}
            mode="update"
            onSubmitted={onRecorderSubmitted}
          />
        </CopilotProvider>
      ) : null}

      {showBanner ? (
        <Card testID="update-route-banner" style={styles.card}>
          <View style={styles.bannerRow}>
            <Ionicons name="alert-circle-outline" size={22} color={theme.color.primary[500]} />
            <View style={styles.bannerTextWrap}>
              <AppText variant="body" weight="medium">Route may have changed</AppText>
              <AppText variant="caption" color={theme.color.text.secondary} style={styles.bannerSubtitle}>
                Re-record your route so your manager can review the update.
              </AppText>
            </View>
          </View>
          <PrimaryButton
            title="Update route"
            variant="secondary"
            onPress={onShowUpdateRecorder}
            testID="update-route-button"
          />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: theme.space[3],
  },
  card: {
    marginBottom: theme.space[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.space[2],
  },
  headerIcon: {
    marginRight: theme.space[2],
  },
  subtitle: {
    lineHeight: 18,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[2],
    marginBottom: theme.space[3],
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerSubtitle: {
    marginTop: theme.space[1],
  },
});
