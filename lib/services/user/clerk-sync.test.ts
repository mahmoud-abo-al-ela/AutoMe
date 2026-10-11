import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/repositories/user", () => ({
  findUserByClerkId: vi.fn(),
  createUser: vi.fn(),
  updateUsersByClerkId: vi.fn(),
  deleteUserByClerkId: vi.fn(),
}));
vi.mock("@/lib/repositories/webhook", () => ({ claimWebhookEvent: vi.fn(), releaseWebhookEvent: vi.fn() }));
vi.mock("@/lib/utils/errors", () => ({ logError: vi.fn() }));

import * as users from "@/lib/repositories/user";
import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { logError } from "@/lib/utils/errors";
import { applyClerkUserEvent, type ClerkUserEvent } from "./clerk-sync";

const event = (type: string, data: Partial<ClerkUserEvent["data"]> = {}): ClerkUserEvent => ({
  type,
  data: { id: "clerk_1", ...data },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(claimWebhookEvent).mockResolvedValue(true);
  vi.mocked(releaseWebhookEvent).mockResolvedValue(undefined as never);
});

describe("applyClerkUserEvent", () => {
  it("does nothing for an event already processed", async () => {
    vi.mocked(claimWebhookEvent).mockResolvedValue(false);
    expect(await applyClerkUserEvent("msg_1", event("user.created"))).toBe("duplicate");
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it("creates the user, named from first and last name, or the username, or 'User'", async () => {
    vi.mocked(users.findUserByClerkId).mockResolvedValue(null);
    await applyClerkUserEvent("msg_1", event("user.created", { first_name: "Mona", last_name: "Adel", email_addresses: [{ email_address: "mona@test.local" }] }));
    expect(users.createUser).toHaveBeenCalledWith(expect.objectContaining({ clerkId: "clerk_1", name: "Mona Adel", email: "mona@test.local" }));

    await applyClerkUserEvent("msg_2", event("user.created", { username: "mona_a" }));
    expect(users.createUser).toHaveBeenLastCalledWith(expect.objectContaining({ name: "mona_a", email: null }));

    await applyClerkUserEvent("msg_3", event("user.created"));
    expect(users.createUser).toHaveBeenLastCalledWith(expect.objectContaining({ name: "User" }));
  });

  it("leaves a user checkUser already created alone", async () => {
    vi.mocked(users.findUserByClerkId).mockResolvedValue({ id: "u1" } as never);
    await applyClerkUserEvent("msg_1", event("user.created"));
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it("updates without wiping an address the event does not carry, and logs a miss", async () => {
    vi.mocked(users.updateUsersByClerkId).mockResolvedValue(0);
    expect(await applyClerkUserEvent("msg_1", event("user.updated", { first_name: "Mona" }))).toBe("processed");
    expect(users.updateUsersByClerkId).toHaveBeenCalledWith("clerk_1", { name: "Mona", email: undefined, imageUrl: undefined });
    expect(logError).toHaveBeenCalledOnce();
  });

  it("deletes a user it knows, and ignores one it does not", async () => {
    vi.mocked(users.findUserByClerkId).mockResolvedValue({ id: "u1" } as never);
    await applyClerkUserEvent("msg_1", event("user.deleted"));
    expect(users.deleteUserByClerkId).toHaveBeenCalledWith("clerk_1");

    vi.mocked(users.deleteUserByClerkId).mockClear();
    vi.mocked(users.findUserByClerkId).mockResolvedValue(null);
    await applyClerkUserEvent("msg_2", event("user.deleted"));
    expect(users.deleteUserByClerkId).not.toHaveBeenCalled();
  });

  it("releases its claim when applying fails, so the retry can run", async () => {
    vi.mocked(users.findUserByClerkId).mockResolvedValue(null);
    vi.mocked(users.createUser).mockRejectedValue(new Error("database down"));
    await expect(applyClerkUserEvent("msg_1", event("user.created"))).rejects.toThrow("database down");
    expect(releaseWebhookEvent).toHaveBeenCalledWith("msg_1");
  });
});
