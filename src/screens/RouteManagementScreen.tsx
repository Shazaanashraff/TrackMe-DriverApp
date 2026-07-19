import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { AppError, normalizeError } from '../lib/errors';
import { useRoutesManagementQuery, useCreateRoute } from '../hooks/routes';
import AppText from '../components/ui/AppText';
import ScreenHeader from '../components/ui/ScreenHeader';
import LoadingScreen from '../components/ui/LoadingScreen';
import OfflineBanner from '../components/ui/OfflineBanner';
import Card from '../components/ui/Card';
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
      <ScreenHeader title="My routes" onBack={() => navigation.goBack()} />

      <RouteList
        routes={routes}
        isError={routesQuery.isError}
        error={routesQuery.error ? asAppError(routesQuery.error) : null}
        onRetry={() => routesQuery.refetch()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        formSlot={
          <View style={styles.formSlot}>
            {createdRouteName ? (
              <Card style={styles.successBanner}>
                <View style={styles.successRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.color.success.main} />
                  <AppText variant="label" weight="medium" color={theme.color.success.text}>
                    {`${createdRouteName} added.`}
                  </AppText>
                </View>
              </Card>
            ) : null}
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
    backgroundColor: theme.color.surface.page,
  },
  formSlot: {
    marginBottom: theme.space[4],
  },
  successBanner: {
    backgroundColor: theme.color.success.bg,
    marginBottom: theme.space[4],
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
});

export default RouteManagementScreen;
