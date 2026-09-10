import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BroadcastPanel from "../BroadcastPanel";
import { useCommunication } from "../provider";
import { announcementDraft, mergeMessages } from "../state";
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
test("cancel sends nothing; offline explicit retry retains original request ID", async () => {
  const ui = mount();
  await waitFor(() =>
    expect(
      ui.getByTestId("quick-on_my_way").props.accessibilityState.disabled
    ).toBe(false)
  );
  fireEvent.press(ui.getByTestId("quick-on_my_way"));
  fireEvent.press(ui.getByText("Cancel"));
  expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);
  await waitFor(() =>
    expect(ui.getByText("Review saved broadcast")).toBeTruthy()
  );
  online = false;
  fireEvent.press(ui.getByText("All enrolled riders · 2"));
  fireEvent.press(ui.getByText("Cancel"));
  fireEvent.press(ui.getByText("Review saved broadcast"));
  fireEvent.press(ui.getByTestId("send-broadcast"));
  await waitFor(() => expect(ui.getByText("Not sent—offline")).toBeTruthy());
  const original = JSON.parse(
    await AsyncStorage.getItem("communication-draft:driver-1:broadcast")
  );
  expect(request.mock.calls.filter((c) => c[1] === "POST")).toHaveLength(0);
  online = true;
  fireEvent.press(ui.getByText("All enrolled riders · 2"));
  fireEvent.press(ui.getByText("Cancel"));
  fireEvent.press(ui.getByText("Review saved broadcast"));
  fireEvent.press(ui.getByTestId("send-broadcast"));
  await waitFor(() =>
    expect(request.mock.calls.find((c) => c[1] === "POST")[2].requestId).toBe(
      original.body.requestId
    )
  );
});
test("audience preview is copied and socket/poll messages deduplicate", () => {
  const selected = ["rider-a"];
  const draft = announcementDraft(presets[0], rows, selected, "2026-09-08");
  selected.push("rider-b");
  expect(draft.body.riderIds).toEqual(["rider-a"]);
  const message = { _id: "1", eventId: "event-1" };
  expect(mergeMessages([message], [message])).toHaveLength(1);
});

test("bounds the fixed quick actions inside a scrollable viewport region", async () => {
  const ui = mount();
  await waitFor(() =>
    expect(
      ui.getByTestId("quick-on_my_way").props.accessibilityState.disabled
    ).toBe(false)
  );

  const scroll = ui.getByTestId("fixed-broadcast-scroll");
  expect(scroll.props.nestedScrollEnabled).toBe(true);
  expect(scroll.props.style.maxHeight).toBeGreaterThanOrEqual(280);
  expect(scroll.props.style.maxHeight).toBeLessThanOrEqual(560);
});
