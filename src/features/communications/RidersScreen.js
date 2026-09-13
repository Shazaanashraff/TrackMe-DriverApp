// The driver's Riders tab: who they carry, and who is away today.
//
// Only the visible segment is mounted. Each body loads its own endpoint on open
// and again whenever the provider invalidates it (hooks.js), so rendering the
// hidden one would fetch a list the driver is not looking at.
import React, { useState } from "react";
import { View } from "react-native";
import { Page, Segmented, styles } from "./components";
import { RiderDirectory } from "./RiderDirectory";
import { AbsencesScreen } from "./screens";

const SEGMENTS = [
  { value: "riders", label: "Riders" },
  { value: "absences", label: "Absences" },
];

export default function RidersScreen({ navigation, route }) {
  // The Home panel's absence actions deep-link straight to the second segment.
  const tab = route.params?.tab;
  const openedAt = route.params?.openedAt;
  const [segment, setSegment] = useState(tab === "absences" ? "absences" : "riders");
  // A bottom-tab screen stays mounted, so the initial state above only
  // covers the first visit. A later tap on the Home pill arrives as a new
  // `openedAt` on the already-mounted screen; adopt the requested segment
  // the moment it changes (derived state, adjusted during render).
  const [seenOpenedAt, setSeenOpenedAt] = useState(openedAt);
  if (openedAt !== seenOpenedAt) {
    setSeenOpenedAt(openedAt);
    if (tab === "absences" || tab === "riders") setSegment(tab);
  }

  return (
    <Page title="Riders" navigation={navigation} showBack={false}>
      <View style={styles.segmentedWrap}>
        <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />
      </View>
      {segment === "riders" ? (
        <RiderDirectory navigation={navigation} />
      ) : (
        <AbsencesScreen navigation={navigation} route={route} embedded />
      )}
    </Page>
  );
}
