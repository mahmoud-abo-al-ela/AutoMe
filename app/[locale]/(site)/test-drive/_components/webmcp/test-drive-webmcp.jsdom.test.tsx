import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import testDrive from "@/messages/en/testDrive.json";

const actions = vi.hoisted(() => ({ requestTestDrive: vi.fn(), getBookedTimeSlots: vi.fn() }));
vi.mock("@/actions/test-drive", () => actions);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { installModelContext } from "@/test/fixtures/webmcp";
import TestDriveForm from "../form-components/TestDriveForm";
import type { WorkingHours } from "../../_lib/scheduling";

const CAR = "11111111-1111-4111-8111-111111111111";
// Tuesday 13 October 2026, 10:00 in Cairo.
const NOW = new Date("2026-10-13T07:00:00Z");
const THURSDAY = "2026-10-15";
const FRIDAY = "2026-10-16";

const open = { isOpen: true, openTime: "09:00", closeTime: "17:00" };
const HOURS: WorkingHours = {
  SATURDAY: open,
  SUNDAY: open,
  MONDAY: open,
  TUESDAY: open,
  WEDNESDAY: open,
  THURSDAY: open,
  FRIDAY: { isOpen: false, openTime: "", closeTime: "" },
};

let root: Root | null = null;
let container: HTMLDivElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  actions.getBookedTimeSlots.mockResolvedValue({ success: true, data: [{ startTime: "11:00", endTime: "12:00" }] });
  actions.requestTestDrive.mockResolvedValue({ success: true, data: { id: "td-1" } });
  Element.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
  vi.useRealTimers();
  delete (document as { modelContext?: unknown }).modelContext;
});

async function mount() {
  const context = installModelContext();
  await act(async () =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={{ testDrive }} timeZone="Africa/Cairo">
        <TestDriveForm carId={CAR} workingHours={HOURS} availableDates={[new Date(`${THURSDAY}T12:00:00Z`)]} onSuccess={vi.fn()} />
      </NextIntlClientProvider>
    )
  );
  return context;
}

/** Call a tool and let React render what it changed. */
async function agent(context: ReturnType<typeof installModelContext>, name: string, args: unknown) {
  let reply: unknown;
  await act(async () => {
    reply = await context.call(name, args);
  });
  return reply;
}

const field = (name: string) => container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!.value;

describe("the test-drive form's WebMCP tools", () => {
  it("are offered while the form is on the page", async () => {
    const context = await mount();
    expect(context.names()).toEqual(["check_test_drive_availability", "prepare_test_drive_booking"]);
  });

  it("tell an agent the free start times, leaving out the booked hour", async () => {
    const context = await mount();
    const day = (await agent(context, "check_test_drive_availability", { date: THURSDAY })) as {
      bookable: boolean;
      freeStartTimes: string[];
      booked: unknown[];
    };
    expect(day.bookable).toBe(true);
    expect(day.freeStartTimes).toContain("10:00");
    expect(day.freeStartTimes).not.toContain("11:00");
    expect(day.freeStartTimes).not.toContain("11:30");
    expect(day.booked).toEqual([{ startTime: "11:00", endTime: "12:00" }]);
    expect(await agent(context, "check_test_drive_availability", { date: FRIDAY })).toEqual({ date: FRIDAY, bookable: false, reason: "closed" });
    expect(field("date")).toBe("");
  });

  it("fill the form with a booking, show it, and book nothing", async () => {
    const context = await mount();
    const reply = await agent(context, "prepare_test_drive_booking", {
      date: THURSDAY,
      startTime: "10:00",
      endTime: "11:00",
      notes: "I'd like to try the highway.",
    });
    expect(reply).toMatchObject({ prepared: true, booked: false });
    expect([field("date"), field("startTime"), field("endTime")]).toEqual([THURSDAY, "10:00", "11:00"]);
    expect(container.querySelector("textarea")!.value).toBe("I'd like to try the highway.");
    // The pickers show what was filled in, not their placeholder.
    const triggers = [...container.querySelectorAll('button[role="combobox"]')].map((b) => b.textContent);
    expect(triggers).toEqual(["10:00 AM", "11:00 AM"]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(container.querySelector('button[type="submit"]'));
    expect(actions.requestTestDrive).not.toHaveBeenCalled();
  });

  it("refuse a time the server would refuse, with its reason, and leave the form as it was", async () => {
    const context = await mount();
    for (const [booking, reason] of [
      [{ date: THURSDAY, startTime: "10:30", endTime: "11:30" }, "taken"],
      [{ date: FRIDAY, startTime: "10:00", endTime: "11:00" }, "closed"],
      [{ date: THURSDAY, startTime: "16:30", endTime: "17:30" }, "outsideHours"],
      [{ date: THURSDAY, startTime: "10:15", endTime: "11:15" }, "offGrid"],
      [{ date: "2026-10-13", startTime: "09:00", endTime: "09:30" }, "past"],
      [{ date: "2026-12-01", startTime: "10:00", endTime: "11:00" }, "outsideWindow"],
    ] as const) {
      expect(await agent(context, "prepare_test_drive_booking", booking), reason).toEqual({ prepared: false, reason });
    }
    expect(field("date")).toBe("");
    expect(actions.requestTestDrive).not.toHaveBeenCalled();
  });

  it("send exactly what was filled in once the person presses Submit — and only then", async () => {
    const context = await mount();
    await agent(context, "prepare_test_drive_booking", { date: THURSDAY, startTime: "13:00", endTime: "14:30" });
    expect(actions.requestTestDrive).not.toHaveBeenCalled();

    await act(async () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    expect(actions.requestTestDrive).toHaveBeenCalledTimes(1);
    expect(actions.requestTestDrive).toHaveBeenCalledWith({ carId: CAR, date: THURSDAY, startTime: "13:00", endTime: "14:30", notes: "" });
  });

  it("refuse malformed input before touching the form", async () => {
    const context = await mount();
    for (const args of [{ date: "15/10/2026", startTime: "10:00", endTime: "11:00" }, { date: THURSDAY, startTime: "25:00", endTime: "26:00" }, { date: THURSDAY }]) {
      expect(await agent(context, "prepare_test_drive_booking", args)).toMatchObject({ error: "invalid_input" });
    }
    expect(actions.getBookedTimeSlots).not.toHaveBeenCalled();
  });
});
