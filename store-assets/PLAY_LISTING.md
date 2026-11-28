# Play Console copy — Pingo Driver

Package: `com.pingo.driverapp` · Privacy policy: https://shazaanashraff.github.io/pingo-privacy/
Contact email: mohamedshazaan7@gmail.com · Category: Maps & Navigation (alt: Business)

**App name (≤30):** Pingo Driver

**Short description (≤80):** Share your shuttle's live location and scan rider QR passes.

**Full description (≤4000):**
Pingo Driver is the driver's companion for the Pingo shuttle platform.

• Go on duty with one tap – your vehicle's live location is shared with your riders and your manager while you are on duty, including when the app is in the background or the screen is off.
• Scan rider QR passes – record who boarded and alighted, and see the on-board roster.
• Trip progress and history – see your route and past trips.
• Messages and absences – see which riders are absent and send quick broadcasts.
• Your enrollment key – share it so riders can join your shuttle.

Location sharing starts only when you go on duty and stops when you go off duty. Pingo Driver is for drivers registered with a Pingo-enabled shuttle service.

## Background location declaration (Play Console → App content → Sensitive permissions)
**Feature that needs background location:** Live vehicle tracking. While a driver is on duty the vehicle's position is sent to the server so riders can see the shuttle on their map and managers can monitor the fleet. Drivers lock their phone or switch apps while driving, so foreground-only access would make the vehicle vanish from riders' maps.
**User control:** Sharing starts only when the driver taps "Go on duty" after a prominent in-app disclosure (`BackgroundLocationDisclosure`), runs with a persistent notification ("Pingo is sharing your location"), and stops when the driver goes off duty.
**Demo video must show (YouTube unlisted link):** 1) launch + login, 2) the disclosure screen and the permission prompt (allow "all the time"), 3) tapping Go on duty, the persistent notification, switching to the home screen, 4) the vehicle moving on the passenger app (or admin) map, 5) going off duty.
Also declare foreground service type **location** (permission `FOREGROUND_SERVICE_LOCATION`) with the same justification.

## Data safety form
| Data | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Precise location (incl. background) | Yes | No | App functionality (live tracking) | No — core feature |
| Name, email, user ID | Yes | No | Account management | No |
| Photos/video | No (camera frames scanned on-device, never stored/sent) | — | — | — |
| Device IDs (push token) | Yes | No | App functionality | No |
- Encrypted in transit: Yes. Deletion on request: Yes (contact email). Verify whether the driver app ships crash reporting (user-app uses Sentry) before submitting.

## Other forms
Content rating "Everyone"; target audience 18+ (drivers); no ads; App access: provide a driver test account (driverCode login).

## Graphics
`play-icon-512.png`, `feature-graphic-1024x500.png` (this folder). Phone screenshots (≥2): not yet captured.
