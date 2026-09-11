// The riders a driver currently carries, as a list they can scan at a glance and
// tap into. Grown from the old "Enrolled riders" audience screen: same query,
// same search, same empty/offline copy — the row became a name with a line
// beneath, and the action became the rider rather than a message to them.
import React, { useState } from "react";
import { FlatList, View, Text, TextInput } from "react-native";
import { useCommunication } from "./provider";
import { useCommunicationQuery } from "./hooks";
import { RiderRow, Freshness, styles } from "./components";
import { emptyListMessage } from "./screens";
import { resourceId, gradeLine } from "./state";
import { theme } from "../../theme";

// Beneath the name: what this rider is to the driver today. Grade first when
// there is one, because it is what tells two riders of the same school apart.
const subtitle = (rider) =>
  [gradeLine(rider.category, rider.grade), rider.organization, rider.pickup?.label]
    .filter(Boolean)
    .join(" · ");

export function RiderDirectory({ navigation }) {
  const { online } = useCommunication();
  const query = useCommunicationQuery("/driver/riders");
  const [search, setSearch] = useState("");
  const filtered = (query.data || []).filter((r) =>
    `${r.riderName} ${r.riderCode}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <View style={{ paddingHorizontal: theme.space[4], gap: theme.space[2] }}>
        <TextInput
          accessibilityLabel="Search riders"
          style={styles.field}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or rider code"
        />
        <Freshness query={query} online={online} />
      </View>
      <FlatList
        testID="rider-directory"
        data={filtered}
        keyExtractor={(r) => resourceId(r.riderId)}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <Text style={styles.text}>
            {emptyListMessage(
              query,
              online,
              "Loading enrolled riders…",
              "Could not load enrolled riders.",
              search
                ? "No riders match this search."
                : "No active rider enrollments yet."
            )}
          </Text>
        }
        renderItem={({ item }) => (
          <RiderRow
            testID={`rider-row-${resourceId(item.riderId)}`}
            name={item.riderName}
            subtitle={subtitle(item) || item.riderCode}
            onPress={() =>
              navigation.navigate("RiderProfile", { riderId: resourceId(item.riderId) })
            }
          />
        )}
      />
    </>
  );
}
