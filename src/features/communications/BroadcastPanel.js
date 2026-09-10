import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCommunication } from "./provider";
import { useCommunicationQuery, useExplicitSend } from "./hooks";
import {
  Action,
  SendPreview,
  AudienceSelector,
  QuickActionGrid,
  CancellationStrip,
  styles,
} from "./components";
import {
  announcementDraft,
  deliverySummary,
  newRequestId,
  colomboToday,
} from "./state";
function useBroadcast() {
  const { accountId } = useCommunication();
  const audience = useCommunicationQuery("/driver/riders");
  const templates = useCommunicationQuery("/conversations/presets");
  const sender = useExplicitSend("broadcast");
  const [selected, setSelected] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [announcementId, setAnnouncementId] = useState(null);
  const progress = useCommunicationQuery(
    announcementId ? `/driver/announcements/${announcementId}` : null
  );
  useEffect(() => {
    AsyncStorage.getItem(`last-announcement:${accountId}`)
      .then(setAnnouncementId)
      .catch(() => {});
  }, [accountId]);
  const open = (preset, date) => {
    const draft = announcementDraft(
      preset,
      audience.data || [],
      selected,
      date
    );
    setPreview(draft);
    void sender.save(draft);
  };
  const send = async () => {
    const value = preview;
    setPreview(null);
    const result = await sender.submit(value);
    if (result?._id) {
      setAnnouncementId(result._id);
      await AsyncStorage.setItem(`last-announcement:${accountId}`, result._id);
    }
  };
  // This card offers no way to reopen a saved draft, so one restored from a
  // previous session would only sit here as a line of text a driver can't act
  // on. Drop it once, on the restore, not on the drafts this session saves
  // before each send. The absences screen keeps its own review action.
  const droppedRestored = useRef(false);
  const { restored, draft: restoredDraft, clear, setFeedback } = sender;
  useEffect(() => {
    if (droppedRestored.current || !restored) return;
    droppedRestored.current = true;
    if (restoredDraft) {
      void clear();
      setFeedback("");
    }
  }, [restored, restoredDraft, clear, setFeedback]);
  const retry = useExplicitSend("broadcast-retry");
  const modals = (
    <>
      <AudienceSelector
        visible={selecting}
        rows={audience.data || []}
        selected={selected}
        onChange={setSelected}
        onClose={() => setSelecting(false)}
      />
      <SendPreview
        visible={!!preview}
        draft={preview}
        busy={sender.busy}
        onSend={send}
        onCancel={() => setPreview(null)}
      />
    </>
  );
  const feedback = (
    <View>
      <Text accessibilityLiveRegion="polite" style={styles.feedback}>
        {sender.busy
          ? sender.feedback
          : progress.data
          ? deliverySummary(progress.data)
          : sender.feedback}
      </Text>
      {progress.data?.recipients?.some((r) => r.state === "failed") ? (
        <Action
          label="Retry failed recipients only"
          onPress={() =>
            retry.submit({
              path: `/driver/announcements/${announcementId}/retry`,
              body: {},
            })
          }
          disabled={retry.busy}
        />
      ) : null}
      {retry.feedback ? (
        <Text style={styles.feedback}>{retry.feedback}</Text>
      ) : null}
    </View>
  );
  return {
    audience,
    templates,
    sender,
    selected,
    setSelecting,
    open,
    modals,
    feedback,
  };
}
export default function BroadcastPanel({ navigation }) {
  const b = useBroadcast();
  const changes = useCommunicationQuery(
    `/driver/absences?date=${colomboToday()}`
  );
  const ack = useExplicitSend("home-acknowledgment");
  // A section of the dashboard, not a fixed panel pinned under it. It used to
  // claim up to 58% of the screen height with its own nested scroll, which left
  // the vehicle and quick actions squeezed into a strip above it.
  return (
    <View testID="broadcast-section" style={styles.panel}>
      <View style={styles.panelContent}>
        <CancellationStrip
          changes={changes.data?.changes}
          busy={ack.busy}
          onView={() => navigation.navigate("MainTabs", { screen: "Riders", params: { tab: "absences" } })}
          onAcknowledge={(a) =>
            ack.submit({
              path: `/absences/${a._id}/acknowledge`,
              body: { requestId: newRequestId(), expectedRevision: a.revision },
            })
          }
        />
        {ack.feedback ? (
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>
            {ack.feedback}
          </Text>
        ) : null}
        <View style={styles.row}>
          <Action
            label={`${
              b.selected === null ? "All enrolled riders" : "Selected riders"
            } · ${b.selected?.length ?? b.audience.data?.length ?? 0}`}
            style={{ flex: 1 }}
            onPress={() => b.setSelecting(true)}
          />
          <Action
            label={`Absences · ${changes.data?.absentCount || 0}`}
            onPress={() => navigation.navigate("MainTabs", { screen: "Riders", params: { tab: "absences" } })}
          />
        </View>
        <QuickActionGrid
          actions={b.templates.data?.presets || []}
          onSelect={(preset) => b.open(preset, colomboToday())}
          disabled={
            b.sender.busy || !b.sender.restored || !b.audience.data?.length
          }
        />
        {b.feedback}
      </View>
      {b.modals}
    </View>
  );
}
