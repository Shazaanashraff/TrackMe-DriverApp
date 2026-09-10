// The driver's Riders tab: who they carry, and who is away today.
//
// Only the visible segment is mounted. Both bodies poll their own endpoint every
// 30 s while focused (hooks.js), so rendering the hidden one would double a
// driver's background traffic for a list they are not looking at.
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
  const [segment, setSegment] = useState(route.params?.tab === "absences" ? "absences" : "riders");

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
