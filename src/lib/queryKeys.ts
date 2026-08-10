export const qk = {
  me: () => ['me'] as const,
  myEnrollmentKey: () => ['me', 'enrollment-key'] as const,
  myVehicle: () => ['vehicle', 'mine'] as const,
  route: (routeId: string) => ['routes', 'detail', routeId] as const,
  trips: (page: number) => ['trips', 'history', page] as const,
  boardingRoster: (vehicleId: string) => ['boarding', 'roster', vehicleId] as const,
};
