export const qk = {
  myBus: () => ['bus', 'mine'] as const,
  routes: () => ['routes'] as const,
  routesManagement: () => ['routes', 'management'] as const,
  earningsStats: () => ['earnings', 'stats'] as const,
  earningsHistory: (page: number) => ['earnings', 'history', page] as const,
  dailyBreakdown: () => ['earnings', 'daily'] as const,
};
