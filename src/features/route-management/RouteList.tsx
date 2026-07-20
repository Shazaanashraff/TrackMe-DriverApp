import React from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { AppError } from '../../lib/errors';
import RouteListItem, { Route } from './RouteListItem';

type Props = {
  routes: Route[];
  isError: boolean;
  error?: AppError | null;
  onRetry: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  formSlot: React.ReactNode;
};

export default function RouteList({ routes, isError, error, onRetry, refreshing, onRefresh, formSlot }: Props) {
  if (isError) {
    return (
      <View style={styles.listContent}>
        {formSlot}
        <ErrorState
          error={error ?? new AppError('unknown', 'Failed to load routes')}
          onRetry={onRetry}
          message="Couldn't load. Pull down to try again."
        />
      </View>
    );
  }

  return (
    <FlatList
      data={routes}
      keyExtractor={(item) => String(item._id || item.routeId)}
      renderItem={({ item }) => <RouteListItem route={item} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.color.primary[500]} />
      }
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.listHeaderWrap}>
          {formSlot}
          <View style={styles.listHeaderArea}>
            <AppText variant="h2">Existing routes</AppText>
            <View style={styles.countBadge}>
              <AppText variant="caption" weight="medium" color={theme.color.white}>{routes.length}</AppText>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="map-outline" title="No routes yet" subtitle="Start by adding one above." />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: theme.space[5],
    paddingBottom: theme.space[8],
  },
  listHeaderWrap: {
    marginBottom: theme.space[3],
  },
  listHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    marginTop: theme.space[6],
    marginBottom: theme.space[3],
  },
  countBadge: {
    backgroundColor: theme.color.primary[500],
    paddingHorizontal: theme.space[2],
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
});
