import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { AppError, normalizeError } from '../lib/errors';
import { useRoutesManagementQuery, useCreateRoute } from '../hooks/routes';
import ScreenHeader from '../components/ui/ScreenHeader';
import LoadingScreen from '../components/ui/LoadingScreen';
import OfflineBanner from '../components/ui/OfflineBanner';
import RouteForm, { NewRoutePayload } from '../features/route-management/RouteForm';
import RouteList from '../features/route-management/RouteList';
import { Route } from '../features/route-management/RouteListItem';

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : normalizeError(error);
}

type Props = {
  navigation: { goBack: () => void };
};

const RouteManagementScreen = ({ navigation }: Props) => {
  const [refreshing, setRefreshing] = useState(false);
  const [createdRouteName, setCreatedRouteName] = useState<string | null>(null);

  const routesQuery = useRoutesManagementQuery();
  const createRoute = useCreateRoute();

  const onRefresh = async () => {
    setRefreshing(true);
    await routesQuery.refetch();
    setRefreshing(false);
  };

  const handleCreateRoute = (payload: NewRoutePayload) => {
    setCreatedRouteName(null);
    createRoute.mutate(payload, {
      onSuccess: () => setCreatedRouteName(payload.routeName),
    });
  };

  if (routesQuery.isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  const routes = (routesQuery.data as Route[]) || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <OfflineBanner />
      <ScreenHeader title="Route Management" onBack={() => navigation.goBack()} rightElement={undefined} style={undefined} />

      <RouteList
        routes={routes}
        isError={routesQuery.isError}
        error={routesQuery.error ? asAppError(routesQuery.error) : null}
        onRetry={() => routesQuery.refetch()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        formSlot={
          <View style={styles.formSlot}>
            {createdRouteName && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.successText}>{createdRouteName} created successfully.</Text>
              </View>
            )}
            <RouteForm
              isSubmitting={createRoute.isPending}
              error={createRoute.isError ? asAppError(createRoute.error) : null}
              onSubmit={handleCreateRoute}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formSlot: {
    marginBottom: SPACING.lg,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    flexShrink: 1,
  },
});

export default RouteManagementScreen;
