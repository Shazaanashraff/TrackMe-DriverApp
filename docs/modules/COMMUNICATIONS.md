# Communications

Driver Home keeps a Signal Ink quick-broadcast panel above bottom navigation in idle and active-trip states. The six fixed presets open a review sheet containing exact server wording, Colombo date, audience, and recipient count; Send is the second action. Audience selection and More updates expose selected riders, custom messages, other delays, future service-unavailability notices, and linked corrections.

Failed/offline drafts persist in AsyncStorage and are sent only after an explicit retry. Stable request IDs prevent duplicate messages after lost responses. Broadcast progress persists near the panel, and retry submits failed recipients only. The cancellation strip remains until its exact absence revision is explicitly acknowledged.

Messages lists private rider conversations with unread badges. Conversation and absence screens refetch on focus, foreground, reconnect, socket events, and every 30 seconds while visible and online. Cached absence lists show freshness/stale state. QR boarding remains independent and surfaces a planned-absence discrepancy after a valid scan.

The authenticated `CommunicationProvider` owns Socket.IO and push registration for the full signed-in session. Configure `EXPO_PUBLIC_EAS_PROJECT_ID`, EAS push credentials, and `GOOGLE_SERVICES_FILE` for Android development/production builds. Expo Go cannot validate remote push delivery; use a configured development build and a physical device.
