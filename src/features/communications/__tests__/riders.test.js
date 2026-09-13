import React from "react";
import { Image } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RidersScreen from "../RidersScreen";
import RiderProfileScreen from "../RiderProfileScreen";
import { useCommunication } from "../provider";
import { gradeLine, toDisplayDate, colomboToday } from "../state";

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
  const tree = (nextParams) => (
    <QueryClientProvider client={client}>
      <Screen navigation={navigation} route={{ params: nextParams }} />
    </QueryClientProvider>
  );
  const ui = render(tree(params));
  // A bottom-tab screen stays mounted, so a later navigate reaches it as new
  // params on the same instance; this is that, without a navigator.
  const setParams = (nextParams) => ui.rerender(tree(nextParams));
  return { ...ui, navigation, setParams };
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

  // The tab keeps living after its first visit. Tapping the Home pill again
  // used to leave it on whichever segment it was last on, because only the
  // initial params were ever read.
  test("a later tap on the Home pill still moves an already-open tab to absences", async () => {
    const ui = mount(RidersScreen);
    await ui.findByText("Amal");

    ui.setParams({ tab: "absences", openedAt: 1 });
    await waitFor(() => expect(ui.queryByTestId("rider-directory")).toBeNull());

    // The driver flips back to the directory by hand, then taps the pill again:
    // same tab value, new openedAt, and the segment must still move.
    fireEvent.press(ui.getByTestId("segment-riders"));
    await ui.findByText("Amal");
    ui.setParams({ tab: "absences", openedAt: 2 });
    await waitFor(() => expect(ui.queryByTestId("rider-directory")).toBeNull());
  });

  // A driver has no use for a rider's face; the name and pickup are what they
  // scan for. Nothing in this app renders or fetches a picture, even when the
  // roster says one exists.
  test("no picture anywhere: riders list, absences, or a rider's profile", async () => {
    const noPicture = (ui) => {
      expect(ui.UNSAFE_queryAllByType(Image)).toHaveLength(0);
      expect(ui.queryByText(/^[A-Z]{1,2}$/, { includeHiddenElements: true })).toBeNull();
    };
    const list = mount(RidersScreen);
    await list.findByText("Amal");
    noPicture(list);
    fireEvent.press(list.getByTestId("segment-absences"));
    await list.findByText("Amal");
    noPicture(list);
    const profile = mount(RiderProfileScreen, { riderId: "rider-a" });
    await profile.findByText("Amal");
    noPicture(profile);
    expect(request.mock.calls.some(([path]) => path.endsWith("/avatar"))).toBe(false);
  });

  // Lists reload on open and on socket events, so there is nothing for a
  // Refresh button to do that opening the tab does not.
  test("neither segment offers a Refresh button", async () => {
    const ui = mount(RidersScreen);
    await ui.findByText("Amal");
    expect(ui.queryByText("Refresh")).toBeNull();
    fireEvent.press(ui.getByTestId("segment-absences"));
    await ui.findByText("Amal");
    expect(ui.queryByText("Refresh")).toBeNull();
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
  });

  test("tapping an absent rider opens that rider", async () => {
    const ui = mount(RidersScreen, { tab: "absences" });
    fireEvent.press(await ui.findByTestId("absent-row-rider-a"));
    expect(ui.navigation.navigate).toHaveBeenCalledWith("RiderProfile", { riderId: "rider-a" });
  });

  // Riders can only report today, so the driver never chooses a date: one
  // read-only line says which day this is, and the request is always today.
  test("shows today as a read-only DD/MM/YYYY line and asks for today", async () => {
    const ui = mount(RidersScreen, { tab: "absences" });
    await ui.findByText("Amal");
    expect(ui.getByText(/^Today · \d{2}\/\d{2}\/\d{4}$/)).toBeTruthy();
    expect(ui.queryByLabelText(/Date/)).toBeNull();
    expect(ui.queryByText("Today")).toBeNull();
    expect(ui.queryByText("Tomorrow")).toBeNull();
    expect(request).toHaveBeenCalledWith(`/driver/absences?date=${colomboToday()}`);
  });

  test("a date with nobody absent says so", async () => {
    request.mockImplementation(async (path) => {
      if (path.startsWith("/driver/absences")) return { ...absences, rows: [], absentCount: 0 };
      return {};
    });
    const ui = mount(RidersScreen, { tab: "absences" });
    expect(await ui.findByText("No riders absent today.")).toBeTruthy();
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

describe("toDisplayDate", () => {
  test("ISO reads as DD/MM/YYYY, and anything else as nothing", () => {
    expect(toDisplayDate("2026-09-11")).toBe("11/09/2026");
    expect(toDisplayDate("")).toBe("");
    expect(toDisplayDate(undefined)).toBe("");
  });
});
