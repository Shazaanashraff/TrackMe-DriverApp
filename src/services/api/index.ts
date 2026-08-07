import * as auth from './auth';
import * as vehicle from './vehicle';
import * as routes from './routes';
import * as trips from './trips';
import * as customRoutes from './customRoutes';
import * as boarding from './boarding';

const api = {
  // auth
  login: auth.login,
  register: auth.register,
  refreshToken: auth.refreshToken,
  logout: auth.logout,

  // vehicle
  getMyVehicle: vehicle.getMyVehicle,
  registerVehicle: vehicle.registerVehicle,
  updateVehicle: vehicle.updateVehicle,

  // routes
  getRouteById: routes.getRouteById,

  // trips
  getDriverTrips: trips.getDriverTrips,
  getDriverTripDetails: trips.getDriverTripDetails,

  // custom routes
  getMyCustomRoute: customRoutes.getMyCustomRoute,
  recordCustomRoute: customRoutes.recordCustomRoute,
  reportJourney: customRoutes.reportJourney,
  recordRouteUpdate: customRoutes.recordRouteUpdate,

  // boarding
  submitBoardingScan: boarding.submitBoardingScan,
};

export default api;
