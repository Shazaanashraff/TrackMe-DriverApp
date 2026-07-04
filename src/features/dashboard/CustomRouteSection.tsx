import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CopilotProvider } from 'react-native-copilot';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
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
  children: React.ReactNode;
};

export default function CustomRouteSection({
  bus,
  customRoute,
  showUpdateRecorder,
  onShowUpdateRecorder,
  onRecorderSubmitted,
  children,
}: Props) {
  const isPendingCustomRoute =
    customRoute?.isCustomRoute && customRoute?.status === 'PENDING_NAMING';
  const isRecordedAwaitingNaming = isPendingCustomRoute && (customRoute?.stopsCount || 0) > 0;
  const isActiveCustomRoute = customRoute?.isCustomRoute && customRoute?.status === 'ACTIVE';

  return (
    <>
      {isRecordedAwaitingNaming ? (
        <View style={styles.card} testID="custom-route-pending-naming">
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.headerIcon} />
              <Text style={styles.headerLabel}>Awaiting manager naming</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Your recorded route ({customRoute?.stopsCount} stops, {customRoute?.distance ?? 0} km)
            has been sent to your manager. You'll be able to start journeys once it's named.
          </Text>
        </View>
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
      ) : (
        children
      )}

      {isActiveCustomRoute && customRoute?.hasPendingChangeRequest && !showUpdateRecorder && (
        <View style={styles.banner} testID="update-route-banner">
          <Ionicons name="alert-circle-outline" size={22} color={COLORS.primary} />
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>Route may have changed</Text>
            <Text style={styles.bannerSubtitle}>
              Re-record your route so your manager can review the update.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={onShowUpdateRecorder}
            testID="update-route-button"
          >
            <Text style={styles.bannerButtonText}>Update Route</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 10,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bannerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerButtonText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
