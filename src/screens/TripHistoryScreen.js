import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDriverTripsQuery } from '../hooks/trips';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import OfflineBanner from '../components/ui/OfflineBanner';
import { formatTime } from '../helpers/formatters';

const TripHistoryScreen = () => {
  // Shared TanStack Query cache (see docs/DATA_LAYER.md) — gives an instant cached
  // list on revisit and, unlike the old useState/useEffect version, never clears the
  // list to [] just because a background refresh failed (issue #15).
  const { data, isLoading, refetch } = useDriverTripsQuery();
  const [refreshing, setRefreshing] = useState(false);
  const trips = data?.trips || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderTrip = useCallback(({ item }) => {
    const tripDate = new Date(item.journeyDate).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <Card style={styles.tripCard}>
        <View style={styles.tripRow}>
          <View style={styles.iconBadge}>
            <Ionicons name="bus" size={20} color={theme.color.primary[500]} />
          </View>
          <View style={styles.textBlock}>
            <AppText variant="body" weight="medium" numberOfLines={1}>
              {item.routeId?.source || 'Origin'} → {item.routeId?.destination || 'Destination'}
            </AppText>
            <AppText variant="caption" color={theme.color.text.muted}>{tripDate}</AppText>
          </View>
          {item.startTime ? (
            <AppText variant="caption" color={theme.color.text.muted}>{formatTime(item.startTime)}</AppText>
          ) : null}
        </View>
      </Card>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <OfflineBanner />
      <View style={styles.header}>
        <AppText variant="h1">Trips</AppText>
        <AppText variant="label" color={theme.color.text.secondary}>Your completed journeys</AppText>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          <Skeleton height={92} style={styles.skeletonRow} />
          <Skeleton height={92} style={styles.skeletonRow} />
          <Skeleton height={92} />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderTrip}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              fill
              icon="receipt-outline"
              title="No trips yet"
              subtitle="Finish a journey and it will show up here."
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.color.primary[500]} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  header: {
    padding: theme.space[5],
    paddingBottom: theme.space[3],
  },
  listContent: {
    padding: theme.space[5],
    paddingTop: 0,
    paddingBottom: theme.space[8],
    // Lets the empty state claim the full remaining height instead of stranding
    // itself under the header.
    flexGrow: 1,
  },
  skeletonRow: {
    marginBottom: theme.space[3],
  },
  tripCard: {
    marginBottom: theme.space[3],
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
});

export default TripHistoryScreen;
