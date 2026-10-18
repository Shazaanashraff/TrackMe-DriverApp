import * as auth from './auth';
import * as vehicle from './vehicle';
import * as routes from './routes';
import * as trips from './trips';
import * as boarding from './boarding';
import * as appReleases from './appReleases';

const api = {
  // auth
  login: auth.login,
  register: auth.register,
  getMe: auth.getMe,
  getMyEnrollmentKey: auth.getMyEnrollmentKey,
  refreshToken: auth.refreshToken,
  logout: auth.logout,

  // vehicle
  getMyVehicle: vehicle.getMyVehicle,
  updateVehicle: vehicle.updateVehicle,

  // routes
  getRouteById: routes.getRouteById,

  // trips
  getDriverTrips: trips.getDriverTrips,
  getDriverTripDetails: trips.getDriverTripDetails,

  // boarding
  submitBoardingScan: boarding.submitBoardingScan,
  getBoardingRoster: boarding.getBoardingRoster,

  // app releases (public)
  getLatestAppRelease: appReleases.getLatestAppRelease,
};

export default api;
