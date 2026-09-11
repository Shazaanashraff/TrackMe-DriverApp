import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RidersScreen from "../RidersScreen";
import RiderProfileScreen from "../RiderProfileScreen";
import { useCommunication } from "../provider";
import { gradeLine } from "../state";

jest.mock("../provider", () => ({ useCommunication: jest.fn() }));
jest.mock("@react-navigation/native", () => ({ useIsFocused: () => true }));
jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));

// Mirrors GET /api/driver/riders (backend services/communications.js `audience`).
// The roster deliberately carries no phone number and no address — those live on
// the per-rider request — so a fixture that grew them would hide a real leak.
const riders = [
  {
    riderId: "rider-a",
    riderName: "Amal",
    riderCode: "RDR-AMAL",
    category: "SCHOOL",
    grade: "7",
    organization: "Royal College",
    pickup: { label: "Home gate" },
    hasAvatar: true,
    avatarVersion: 2,
  },
  {
    riderId: "rider-b",
    riderName: "Nuwan",
    riderCode: "RDR-NUWAN",
    category: "UNIVERSITY",
    grade: "",
    organization: "University of Colombo",
    pickup: { label: "Main junction" },
    hasAvatar: false,
    avatarVersion: 0,
  },
];

// Mirrors GET /api/driver/absences?date=…: riderId is populated with name and
// code only, so the row's second line comes from the enrollment.
const enrollment = {
  driverId: { organization: { name: "Royal College" } },
  pickupPlaceId: { label: "Home gate", address: "12 Lake Road" },
};
const absences = {
  rows: [
    {
      _id: "abs-a",
      status: "ABSENT",
      date: "2026-09-10",
      revision: 1,
      riderId: { _id: "rider-a", fullName: "Amal", riderCode: "RDR-AMAL" },
      enrollmentId: enrollment,
    },
    {
      _id: "abs-b",
      status: "CANCELLED",
      date: "2026-09-10",
      revision: 2,
      riderId: { _id: "rider-b", fullName: "Nuwan", riderCode: "RDR-NUWAN" },
      enrollmentId: enrollment,
    },
  ],
  changes: [],
  absentCount: 1,
  today: "2026-09-10",
};

const profiles = {
  "rider-a": {
    riderId: "rider-a",
    riderName: "Amal",
    riderCode: "RDR-AMAL",
    category: "SCHOOL",
    grade: "7",
    contactNumber: "0770000001",
    hasAvatar: true,
    avatarVersion: 2,
  },
  "rider-b": {
    riderId: "rider-b",
    riderName: "Nuwan",
    riderCode: "RDR-NUWAN",
    category: "UNIVERSITY",
    grade: "",
    contactNumber: "",
    hasAvatar: false,
    avatarVersion: 0,
  },
};

let request, online, clients;
beforeEach(async () => {
  await AsyncStorage.clear();
  online = true;
  clients = [];
  request = jest.fn(async (path) => {
    if (path === "/driver/riders") return riders;
    if (path === "/driver/riders/rider-a") return profiles["rider-a"];
    if (path === "/driver/riders/rider-b") return profiles["rider-b"];
    if (path.endsWith("/avatar")) return { avatarUrl: "data:image/png;base64,AAAA", avatarVersion: 2 };
    if (path.startsWith("/driver/absences")) return absences;
    return {};
  });
  useCommunication.mockImplementation(() => ({
    request,
    online,
    accountId: "driver-1",
    role: "driver",
  }));
});
afterEach(() => clients.forEach((c) => c.clear()));

function mount(Screen, params = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const ui = render(
    <QueryClientProvider client={client}>
      <Screen navigation={navigation} route={{ params }} />
    </QueryClientProvider>
  );
  return { ...ui, navigation };
}

describe("the Riders tab", () => {
  test("opens on the riders list and shows each rider's grade and pickup", async () => {
    const ui = mount(RidersScreen);
    expect(await ui.findByText("Amal")).toBeTruthy();
    expect(ui.getByText("Grade 7 · Royal College · Home gate")).toBeTruthy();
    // A university rider is never asked for a grade, so the line simply starts
    // with the organization rather than showing an empty separator.
    expect(ui.getByText("University of Colombo · Main junction")).toBeTruthy();
  });

  test("tapping a rider opens that rider, not another", async () => {
    const ui = mount(RidersScreen);
    fireEvent.press(await ui.findByTestId("rider-row-rider-b"));
    expect(ui.navigation.navigate).toHaveBeenCalledWith("RiderProfile", { riderId: "rider-b" });
  });

  test("search matches a name or a rider code", async () => {
    const ui = mount(RidersScreen);
    await ui.findByText("Amal");
    fireEvent.changeText(ui.getByLabelText("Search riders"), "nuwan");
    await waitFor(() => expect(ui.queryByText("Amal")).toBeNull());
    expect(ui.getByText("Nuwan")).toBeTruthy();

    fireEvent.changeText(ui.getByLabelText("Search riders"), "RDR-AMAL");
    await waitFor(() => expect(ui.queryByText("Nuwan")).toBeNull());
    expect(ui.getByText("Amal")).toBeTruthy();
  });

  test("a search that matches nobody says so, rather than looking broken", async () => {
    const ui = mount(RidersScreen);
    await ui.findByText("Amal");
    fireEvent.changeText(ui.getByLabelText("Search riders"), "zzz");
    expect(await ui.findByText("No riders match this search.")).toBeTruthy();
  });

  // Each segment loads its own endpoint on open, so mounting the hidden one
  // would fetch a list the driver is not looking at.
  test("only the visible segment is mounted, so only it loads", async () => {
    const ui = mount(RidersScreen);
    await ui.findByText("Amal");
    expect(request.mock.calls.some(([path]) => path.startsWith("/driver/absences"))).toBe(false);

    fireEvent.press(ui.getByTestId("segment-absences"));
    await waitFor(() =>
      expect(request.mock.calls.some(([path]) => path.startsWith("/driver/absences"))).toBe(true)
    );
    expect(ui.queryByText("Amal")).toBeNull();
  });

  test("the Home panel's absence action lands on the absences segment", async () => {
    const ui = mount(RidersScreen, { tab: "absences" });
    await waitFor(() =>
      expect(request.mock.calls.some(([path]) => path.startsWith("/driver/absences"))).toBe(true)
    );
    expect(ui.queryByTestId("rider-directory")).toBeNull();
  });

  test("the riders list shows no picture and fetches none", async () => {
    const ui = mount(RidersScreen);
    await ui.findByText("Amal");
    expect(ui.queryByText("A", { includeHiddenElements: true })).toBeNull();
    expect(request.mock.calls.some(([path]) => path.endsWith("/avatar"))).toBe(false);
  });
});

describe("the Absences segment", () => {
  test("lists only the riders who are absent, as plain rows", async () => {
    const ui = mount(RidersScreen, { tab: "absences" });
    expect(await ui.findByText("Amal")).toBeTruthy();
    expect(ui.getByText("Royal College · Home gate")).toBeTruthy();
    // A cancelled absence is the Home strip's business, not this list's.
    expect(ui.queryByText("Nuwan")).toBeNull();
    expect(ui.queryByText(/Coming after cancellation/)).toBeNull();
    expect(ui.queryByText(/History/)).toBeNull();
    expect(ui.queryByText(/absent ·/)).toBeNull();
    expect(ui.queryByText("Refresh")).toBeNull();
  });

  test("tapping an absent rider opens that rider", async () => {
    const ui = mount(RidersScreen, { tab: "absences" });
    fireEvent.press(await ui.findByTestId("absent-row-rider-a"));
    expect(ui.navigation.navigate).toHaveBeenCalledWith("RiderProfile", { riderId: "rider-a" });
  });

  test("a date with nobody absent says so", async () => {
    request.mockImplementation(async (path) => {
      if (path.startsWith("/driver/absences")) return { ...absences, rows: [], absentCount: 0 };
      return {};
    });
    const ui = mount(RidersScreen, { tab: "absences" });
    expect(await ui.findByText("No riders absent on this date.")).toBeTruthy();
  });

  test("search narrows the absent list by name or code", async () => {
    const ui = mount(RidersScreen, { tab: "absences" });
    await ui.findByText("Amal");
    fireEvent.changeText(ui.getByLabelText("Search absences"), "zzz");
    expect(await ui.findByText("No riders match this search.")).toBeTruthy();
    fireEvent.changeText(ui.getByLabelText("Search absences"), "rdr-amal");
    expect(await ui.findByText("Amal")).toBeTruthy();
  });
});

describe("a rider's profile", () => {
  test("shows the grade and the one contact number", async () => {
    const ui = mount(RiderProfileScreen, { riderId: "rider-a" });
    expect(await ui.findByText("Amal")).toBeTruthy();
    expect(ui.getByText("Grade 7")).toBeTruthy();
    expect(ui.getByText("0770000001")).toBeTruthy();
  });

  // The profile shows no address; the roster sends a pickup label only.
  test("never shows an address", async () => {
    const ui = mount(RiderProfileScreen, { riderId: "rider-a" });
    await ui.findByText("Amal");
    expect(ui.queryByText(/Address/i)).toBeNull();
  });

  test("a rider the driver no longer carries reads as no longer enrolled", async () => {
    request.mockImplementation(async () => {
      const error = new Error("Rider not found");
      error.status = 404;
      throw error;
    });
    const ui = mount(RiderProfileScreen, { riderId: "rider-a" });
    // useCommunicationQuery retries once before it settles into an error.
    expect(
      await ui.findByText("This rider is no longer enrolled with you.", {}, { timeout: 5000 })
    ).toBeTruthy();
  });
});

// The picture lives on the profile only; the list is names.
describe("rider pictures", () => {
  test("a rider with no picture never causes a request", async () => {
    const ui = mount(RiderProfileScreen, { riderId: "rider-b" });
    await ui.findByText("Nuwan");
    expect(request.mock.calls.some(([path]) => path.endsWith("/avatar"))).toBe(false);
  });

  test("a picture is fetched once per version and then read from the cache", async () => {
    const ui = mount(RiderProfileScreen, { riderId: "rider-a" });
    await ui.findByText("Amal");
    await waitFor(() =>
      expect(request.mock.calls.filter(([path]) => path === "/driver/riders/rider-a/avatar")).toHaveLength(1)
    );
    expect(await AsyncStorage.getItem("riderAvatar:rider-a:2")).toBe("data:image/png;base64,AAAA");

    ui.unmount();
    const again = mount(RiderProfileScreen, { riderId: "rider-a" });
    await again.findByText("Amal");
    // The second look is free: same version, so the cached copy answers.
    await waitFor(() => expect(again.getByText("Amal")).toBeTruthy());
    expect(request.mock.calls.filter(([path]) => path === "/driver/riders/rider-a/avatar")).toHaveLength(1);
  });

  test("a changed picture is a new version, and the old copy is dropped", async () => {
    await AsyncStorage.setItem("riderAvatar:rider-a:1", "data:image/png;base64,OLD");
    const ui = mount(RiderProfileScreen, { riderId: "rider-a" });
    await ui.findByText("Amal");
    await waitFor(async () =>
      expect(await AsyncStorage.getItem("riderAvatar:rider-a:2")).toBe("data:image/png;base64,AAAA")
    );
    expect(await AsyncStorage.getItem("riderAvatar:rider-a:1")).toBeNull();
  });

  test("an unreachable picture leaves the profile readable", async () => {
    request.mockImplementation(async (path) => {
      if (path === "/driver/riders/rider-a") return profiles["rider-a"];
      if (path.endsWith("/avatar")) throw new Error("offline");
      return {};
    });
    const ui = mount(RiderProfileScreen, { riderId: "rider-a" });
    // The initial still stands in, and nothing throws. It is hidden from screen
    // readers on purpose — the header already carries the rider's full name —
    // so it has to be queried explicitly.
    expect(await ui.findByText("Amal")).toBeTruthy();
    expect(ui.getByText("A", { includeHiddenElements: true })).toBeTruthy();
  });
});

describe("gradeLine", () => {
  test.each([
    ["SCHOOL", "7", "Grade 7"],
    ["SCHOOL", "Grade 7", "Grade 7"],
    ["SCHOOL", "Year 10", "Year 10"],
    ["SCHOOL", "", ""],
    ["UNIVERSITY", "7", ""],
    ["OFFICE", "7", ""],
    [null, "7", ""],
  ])("%s + %s reads as %s", (category, grade, expected) => {
    expect(gradeLine(category, grade)).toBe(expected);
  });
});
