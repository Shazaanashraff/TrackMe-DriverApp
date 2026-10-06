# BUS REGISTRATION - Driver App

**Status:** `REMOVED` (2026-10-06). Drivers no longer register vehicles in the app.

The "Your vehicle" form (`VehicleRegistrationScreen`) never sent a `routeId`, which the backend
requires, so every save failed. Vehicles are created and assigned by the manager in WebAdmin:
Manager › Vehicles › Add Vehicle, or Manager › Drivers › Add Driver with a vehicle number, then
Edit Vehicle › Route.

What the driver sees instead:
- Home and Profile: the vehicle card's empty state reads "No vehicle yet" / "Ask your manager to
  assign one" and is not pressable (`src/features/dashboard/VehicleCard.tsx`).
- The duty hero's status line reads "No vehicle assigned yet" (`dutyHeroState.ts`).

Removed with it: the `VehicleRegistration` route, `useRegisterVehicle`, `api.registerVehicle`,
and their unit, integration and journey tests. `useMyVehicleQuery` and `useUpdateVehicle` stay.
