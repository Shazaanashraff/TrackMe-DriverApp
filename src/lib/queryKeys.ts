export const qk = {
  myVehicle: () => ['vehicle', 'mine'] as const,
  route: (routeId: string) => ['routes', 'detail', routeId] as const,
  trips: (page: number) => ['trips', 'history', page] as const,
};
