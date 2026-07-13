import React from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { AppError } from '../../lib/errors';
import ErrorState from '../../components/ui/ErrorState';
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
        <ErrorState error={error ?? new AppError('unknown', 'Failed to load routes')} onRetry={onRetry} />
      </View>
    );
  }

  return (
    <FlatList
      data={routes}
      keyExtractor={(item) => String(item._id || item.routeId)}
      renderItem={({ item }) => <RouteListItem route={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.listHeaderWrap}>
          {formSlot}
          <View style={styles.listHeaderArea}>
            <Text style={styles.listTitle}>Existing Routes</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{routes.length}</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>No routes found. Start by creating one!</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  listHeaderWrap: {
    marginBottom: SPACING.lg,
  },
  listHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  countBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 10,
  },
  countText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
