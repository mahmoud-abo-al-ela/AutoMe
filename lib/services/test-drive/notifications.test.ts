import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/repositories/test-drive", () => ({
  findTestDriveForRequestEmails: vi.fn(),
  findTestDriveForStatusEmail: vi.fn(),
}));
vi.mock("@/lib/services/notification", () => ({
  sendTestDriveConfirmationEmail: vi.fn(async () => undefined),
  sendTestDriveAdminNotificationEmail: vi.fn(async () => undefined),
  sendTestDriveStatusUpdateEmail: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/datetime", () => ({ cairoNow: () => ({ date: "2026-10-20", time: "12:00" }) }));

import * as repo from "@/lib/repositories/test-drive";
import {
  sendTestDriveConfirmationEmail,
  sendTestDriveAdminNotificationEmail,
  sendTestDriveStatusUpdateEmail,
} from "@/lib/services/notification";
import { notifyTestDriveRequested, notifyTestDriveStatusChanged } from "./notifications";

const car = { title: null, make: "Toyota", model: "Corolla", year: 2020 };
const buyer = { name: "Mona", email: "mona@test.local" };

function drive(date: string, endTime: string) {
  return { date: new Date(`${date}T00:00:00Z`), startTime: "10:00", endTime, car, user: buyer, organization: { name: "Nile Motors" } };
}

beforeEach(() => vi.clearAllMocks());

describe("notifyTestDriveRequested", () => {
  it("tells the buyer, and the dealership at the owner's address when it has none of its own", async () => {
    vi.mocked(repo.findTestDriveForRequestEmails).mockResolvedValue({
      ...drive("2026-10-25", "11:00"),
      organization: {
        name: "Nile Motors",
        email: null,
        address: "Cairo",
        slug: "nile-motors",
        memberships: [{ role: "OWNER", user: { email: "owner@test.local" } }],
      },
    } as never);

    await notifyTestDriveRequested("td-1");

    expect(sendTestDriveConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "mona@test.local", carTitle: "Toyota Corolla 2020" })
    );
    expect(sendTestDriveAdminNotificationEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@test.local" }));
  });

  it("sends nothing for a booking that cannot be found", async () => {
    vi.mocked(repo.findTestDriveForRequestEmails).mockResolvedValue(null);
    await notifyTestDriveRequested("td-1");
    expect(sendTestDriveConfirmationEmail).not.toHaveBeenCalled();
    expect(sendTestDriveAdminNotificationEmail).not.toHaveBeenCalled();
  });
});

describe("notifyTestDriveStatusChanged", () => {
  it("tells the buyer a booking was confirmed", async () => {
    vi.mocked(repo.findTestDriveForStatusEmail).mockResolvedValue(drive("2026-10-25", "11:00") as never);
    await notifyTestDriveStatusChanged("td-1", "CONFIRMED");
    expect(sendTestDriveStatusUpdateEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "mona@test.local", status: "CONFIRMED", dealershipName: "Nile Motors" })
    );
  });

  it("says nothing when a drive is cancelled after its time has passed — the buyer never came", async () => {
    vi.mocked(repo.findTestDriveForStatusEmail).mockResolvedValue(drive("2026-10-20", "11:00") as never);
    await notifyTestDriveStatusChanged("td-1", "CANCELLED");
    expect(sendTestDriveStatusUpdateEmail).not.toHaveBeenCalled();
  });

  it("does tell the buyer of a cancellation before the drive", async () => {
    vi.mocked(repo.findTestDriveForStatusEmail).mockResolvedValue(drive("2026-10-20", "15:00") as never);
    await notifyTestDriveStatusChanged("td-1", "CANCELLED");
    expect(sendTestDriveStatusUpdateEmail).toHaveBeenCalledOnce();
  });

  it("sends nothing, and reads nothing, for other statuses", async () => {
    await notifyTestDriveStatusChanged("td-1", "COMPLETED");
    expect(repo.findTestDriveForStatusEmail).not.toHaveBeenCalled();
    expect(sendTestDriveStatusUpdateEmail).not.toHaveBeenCalled();
  });
});
