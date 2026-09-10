import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BroadcastPanel from "../BroadcastPanel";
import { useCommunication } from "../provider";
import { announcementDraft } from "../state";
jest.mock("../provider", () => ({ useCommunication: jest.fn() }));
jest.mock("@react-navigation/native", () => ({ useIsFocused: () => true }));
jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));
// Mirrors what GET /api/conversations/presets actually returns
// (backend src/utils/communicationTemplates.js PRESETS). Keep the two in step:
// this fixture standing in for a server response is the only reason the grid
// renders at all here.
const presets = [
  {
    id: "on_my_way",
    label: "On my way",
    text: "I’m on my way. Please be ready at your pickup point.",
  },
  {
    id: "delay_10",
    label: "Delay · 10 min",
    text: "I’m running about 10 minutes behind. Sorry for the inconvenience, I’ll update you if this changes.",
  },
];
const rows = [
  { riderId: "rider-a", riderName: "Amal" },
  { riderId: "rider-b", riderName: "Sibling" },
];
let request, online, clients;
beforeEach(async () => {
  await AsyncStorage.clear();
  online = true;
  clients = [];
  request = jest.fn(async (path, method) => {
    if (method === "POST")
      return {
        _id: "announcement-1",
        recipients: rows.map((r) => ({ ...r, state: "sent" })),
      };
    if (path === "/driver/riders") return rows;
    if (path === "/conversations/presets") return { presets };
    if (path.startsWith("/driver/absences"))
      return { rows: [], changes: [], absentCount: 0 };
    return { recipients: rows.map((r) => ({ ...r, state: "sent" })) };
  });
  useCommunication.mockImplementation(() => ({
    request,
    online,
    accountId: "driver-1",
    role: "driver",
  }));
});
afterEach(() => clients.forEach((c) => c.clear()));
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <BroadcastPanel navigation={{ navigate: jest.fn() }} />
    </QueryClientProvider>
  );
}
test.each(presets)(
  "$label takes exactly preset + Send, with no keyboard",
  async (preset) => {
    const ui = mount();
    await waitFor(() =>
      expect(
        ui.getByTestId(`quick-${preset.id}`).props.accessibilityState.disabled
      ).toBe(false)
    );
    fireEvent.press(ui.getByTestId(`quick-${preset.id}`));
    expect(ui.getByText(preset.text)).toBeTruthy();
    expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);
    fireEvent.press(ui.getByTestId("send-broadcast"));
    await waitFor(() =>
      expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(1)
    );
    expect(request.mock.calls.find((c) => c[1] === "POST")[2]).toMatchObject({
      templateId: preset.id,
      recipientCount: 2,
      previewRiderIds: ["rider-a", "rider-b"],
    });
  }
);
test("cancel sends nothing; an offline send is stored, not sent, then goes out online", async () => {
  const ui = mount();
  await waitFor(() =>
    expect(
      ui.getByTestId("quick-on_my_way").props.accessibilityState.disabled
    ).toBe(false)
  );
  fireEvent.press(ui.getByTestId("quick-on_my_way"));
  fireEvent.press(ui.getByText("Cancel"));
  expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);

  online = false;
  fireEvent.press(ui.getByTestId("quick-on_my_way"));
  fireEvent.press(ui.getByTestId("send-broadcast"));
  await waitFor(() => expect(ui.getByText("Not sent, offline")).toBeTruthy());
  expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);

  // The unsent broadcast is still written to storage before the network call,
  // so nothing is lost even though this card no longer offers a review action
  // for it. Re-sending starts from the preset again.
  const stored = JSON.parse(
    await AsyncStorage.getItem("communication-draft:driver-1:broadcast")
  );
  expect(stored.body.requestId).toBeTruthy();

  online = true;
  fireEvent.press(ui.getByTestId("quick-on_my_way"));
  fireEvent.press(ui.getByTestId("send-broadcast"));
  await waitFor(() =>
    expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(1)
  );
});

test("a draft left over from a previous session shows nothing to review", async () => {
  await AsyncStorage.setItem(
    "communication-draft:driver-1:broadcast",
    JSON.stringify(announcementDraft(presets[0], rows, null, "2026-09-08"))
  );

  const ui = mount();
  await waitFor(() =>
    expect(
      ui.getByTestId("quick-on_my_way").props.accessibilityState.disabled
    ).toBe(false)
  );

  expect(ui.queryByText("Review saved broadcast")).toBeNull();
  expect(ui.queryByText("Draft saved, review and retry")).toBeNull();
  await waitFor(async () =>
    expect(
      await AsyncStorage.getItem("communication-draft:driver-1:broadcast")
    ).toBeNull()
  );
});

test("audience preview is copied, not aliased", () => {
  const selected = ["rider-a"];
  const draft = announcementDraft(presets[0], rows, selected, "2026-09-08");
  selected.push("rider-b");
  expect(draft.body.riderIds).toEqual(["rider-a"]);
});

test("renders the quick actions as a dashboard section, not a fixed panel", async () => {
  const ui = mount();
  await waitFor(() =>
    expect(
      ui.getByTestId("quick-on_my_way").props.accessibilityState.disabled
    ).toBe(false)
  );

  // It scrolls with the page now. A nested scroll with its own height cap took
  // over half the screen and squeezed everything above it into a strip.
  const section = ui.getByTestId("broadcast-section");
  expect(section.props.style.maxHeight).toBeUndefined();
  expect(ui.queryByTestId("fixed-broadcast-scroll")).toBeNull();
});
