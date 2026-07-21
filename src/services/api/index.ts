import * as auth from './auth';
import * as bus from './bus';
import * as routes from './routes';
import * as earnings from './earnings';
import * as customRoutes from './customRoutes';
import * as boarding from './boarding';

const api = {
  // auth
  login: auth.login,
  register: auth.register,
  refreshToken: auth.refreshToken,
  logout: auth.logout,

  // bus
  getMyBus: bus.getMyBus,
  registerBus: bus.registerBus,
  updateBus: bus.updateBus,

  // routes
  getRoutes: routes.getRoutes,
  getRoutesManagementList: routes.getRoutesManagementList,
  createRoute: routes.createRoute,

  // earnings
  getDriverEarningsStats: earnings.getDriverEarningsStats,
  getDriverEarningsHistory: earnings.getDriverEarningsHistory,
  getDriverDailyBreakdown: earnings.getDriverDailyBreakdown,
  requestDriverPayout: earnings.requestDriverPayout,

  // custom routes
  getMyCustomRoute: customRoutes.getMyCustomRoute,
  recordCustomRoute: customRoutes.recordCustomRoute,
  reportJourney: customRoutes.reportJourney,
  recordRouteUpdate: customRoutes.recordRouteUpdate,

  // boarding
  submitBoardingScan: boarding.submitBoardingScan,
  getBoardingRoster: boarding.getBoardingRoster,
};

export default api;
