import React from 'react';
import { View, FlatList, SafeAreaView, RefreshControl, StyleSheet } from 'react-native';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';
import StatusPill from '../components/ui/StatusPill';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { formatTime } from '../helpers/formatters';
import { useMyBusQuery } from '../hooks/bus';
import { useBoardingRosterQuery, RosterRider, RosterStatus } from '../hooks/boarding';

type Props = {
  navigation: { goBack: () => void };
  route: { params?: { busId?: string } };
};

type Bus = { busId?: string; _id?: string };

function unwrap<T>(response: unknown): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

const STATUS_META: Record<RosterStatus, { label: string; variant: 'live' | 'neutral' | 'warn' }> = {
  ON: { label: 'On board', variant: 'live' },
  NOT_BOARDED: { label: 'Not boarded', variant: 'neutral' },
  OFF: { label: 'Alighted', variant: 'warn' },
};

function RiderRow({ rider }: { rider: RosterRider }) {
  const meta = STATUS_META[rider.status];
  const time = rider.lastEventAt ? formatTime(rider.lastEventAt) : '';
  return (
    <View style={styles.riderRow} testID={`roster-rider-${rider.studentId}`}>
      <View style={styles.riderText}>
        <AppText variant="body" numberOfLines={1}>{rider.studentName}</AppText>
        {time ? (
          <AppText variant="caption" color={theme.color.text.muted}>{time}</AppText>
        ) : null}
      </View>
      <StatusPill label={meta.label} variant={meta.variant} testID={`roster-status-${rider.studentId}`} />
    </View>
  );
}

const BoardingRosterScreen = ({ navigation, route }: Props) => {
  const myBusQuery = useMyBusQuery();
  const bus = unwrap<Bus>(myBusQuery.data) as Bus | null;
  const busId = route?.params?.busId || bus?.busId || bus?._id || '';

  const { data, isLoading, isError, refetch, isRefetching } = useBoardingRosterQuery(busId);

  const header = (
    <View>
      <Card style={styles.summaryCard}>
        <AppText variant="overline" color={theme.color.text.muted}>On board now</AppText>
        {isLoading && !data ? (
          <Skeleton width={120} height={34} style={styles.summarySkeleton} testID="roster-summary-skeleton" />
        ) : (
          <View style={styles.summaryRow}>
            <AppText variant="display" weight="medium" color={theme.color.primary[500]}>
              {`${data?.onBoardCount ?? 0} / ${data?.enrolledCount ?? 0}`}
            </AppText>
            <AppText variant="label" color={theme.color.text.muted} style={styles.summaryUnit}>
              enrolled riders
            </AppText>
          </View>
        )}
      </Card>
      {data && data.roster.length > 0 ? (
        <AppText variant="h2" style={styles.sectionTitle}>Enrolled riders</AppText>
      ) : null}
    </View>
  );

  const footer =
    data && data.guests.length > 0 ? (
      <View style={styles.guestSection}>
        <AppText variant="h2" style={styles.sectionTitle}>On board (not enrolled)</AppText>
        {data.guests.map((g) => (
          <View key={g.studentId} style={styles.riderRow} testID={`roster-guest-${g.studentId}`}>
            <View style={styles.riderText}>
              <AppText variant="body" numberOfLines={1}>{g.studentName}</AppText>
              {g.lastEventAt ? (
                <AppText variant="caption" color={theme.color.text.muted}>{formatTime(g.lastEventAt)}</AppText>
              ) : null}
            </View>
            <StatusPill label="On board" variant="live" />
          </View>
        ))}
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="On board today" onBack={() => navigation.goBack()} />
      <FlatList
        data={data?.roster ?? []}
        keyExtractor={(item) => item.studentId}
        renderItem={({ item }) => <RiderRow rider={item} />}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.color.primary[500]} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingList}>
              <Skeleton height={48} style={styles.rowSkeleton} />
              <Skeleton height={48} style={styles.rowSkeleton} />
              <Skeleton height={48} style={styles.rowSkeleton} />
            </View>
          ) : isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Couldn't load the roster"
              subtitle="Pull down to try again."
            />
          ) : (
            <EmptyState
              icon="people-outline"
              title="No enrolled riders"
              subtitle="Riders who join this route will appear here."
            />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  listContent: {
    padding: theme.space[5],
    paddingBottom: theme.space[8],
  },
  summaryCard: {
    marginBottom: theme.space[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space[2],
    marginTop: theme.space[1],
  },
  summaryUnit: {
    marginBottom: theme.space[1],
  },
  summarySkeleton: {
    marginTop: theme.space[2],
  },
  sectionTitle: {
    marginBottom: theme.space[2],
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: theme.space[2],
    gap: theme.space[3],
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.color.border.hairline,
  },
  riderText: {
    flex: 1,
  },
  guestSection: {
    marginTop: theme.space[6],
  },
  loadingList: {
    gap: theme.space[3],
  },
  rowSkeleton: {
    marginBottom: theme.space[2],
  },
});

export default BoardingRosterScreen;
