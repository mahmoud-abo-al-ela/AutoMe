import { describe, it, expect, vi, beforeEach } from "vitest";

const { queryChannels, partialUpdateMessage, moderateChatMessage } = vi.hoisted(() => ({
  queryChannels: vi.fn(),
  partialUpdateMessage: vi.fn(),
  moderateChatMessage: vi.fn(),
}));
vi.mock("@/lib/stream-chat", () => ({
  getStreamServerClient: () => ({ queryChannels, partialUpdateMessage }),
}));
vi.mock("@/lib/services/ai", () => ({ moderateChatMessage }));

import { moderateMessage } from "@/lib/services/chat/moderation";

const SCAM = "حول العربون على فودافون كاش قبل ما حد تاني ياخدها";

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    cid: "messaging:car-1",
    type: "regular",
    text: SCAM,
    user: { id: "dealer-staff" },
    ...overrides,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => {});
  queryChannels.mockResolvedValue([{ data: { organization_id: "org-1", created_by: { id: "buyer" } } }]);
  partialUpdateMessage.mockResolvedValue({});
  moderateChatMessage.mockResolvedValue({ reason: "asks for a deposit before a viewing", category: "scam" });
});

describe("moderateMessage", () => {
  it("never calls the model for a message the free screen clears", async () => {
    expect(await moderateMessage(message({ text: "العربية لسه متاحة؟" }))).toBe("clean");
    expect(moderateChatMessage).not.toHaveBeenCalled();
    expect(queryChannels).not.toHaveBeenCalled();
    expect(partialUpdateMessage).not.toHaveBeenCalled();
  });

  it("flags what the model calls a scam, as the author, with the text it judged", async () => {
    expect(await moderateMessage(message())).toBe("flagged");
    expect(moderateChatMessage).toHaveBeenCalledWith(SCAM, "dealership", {
      organizationId: "org-1",
      userId: null,
      priority: "low",
    });
    expect(partialUpdateMessage).toHaveBeenCalledWith(
      "m1",
      { set: { safety_flag: { category: "scam", source: SCAM } } },
      "dealer-staff"
    );
  });

  it("tells the model a message from the conversation's creator is the buyer's", async () => {
    await moderateMessage(message({ user: { id: "buyer" } }));
    expect(moderateChatMessage.mock.calls[0][1]).toBe("buyer");
  });

  it("leaves a message alone when the model finds nothing", async () => {
    moderateChatMessage.mockResolvedValue({ reason: "a reservation deposit at the showroom", category: "none" });
    expect(await moderateMessage(message())).toBe("clean");
    expect(partialUpdateMessage).not.toHaveBeenCalled();
  });

  it("keeps a flag that still matches the text, without asking again", async () => {
    const flagged = message({ safety_flag: { category: "scam", source: SCAM } });
    expect(await moderateMessage(flagged)).toBe("unchanged");
    expect(moderateChatMessage).not.toHaveBeenCalled();
  });

  it("removes a flag once an edit has made the message clean", async () => {
    const edited = message({ text: "تمام، نتقابل في المعرض", safety_flag: { category: "scam", source: SCAM } });
    expect(await moderateMessage(edited)).toBe("cleared");
    expect(partialUpdateMessage).toHaveBeenCalledWith("m1", { unset: ["safety_flag"] }, "dealer-staff");
  });

  it("puts a flag back when the sender strips it from the same text", async () => {
    expect(await moderateMessage(message({ safety_flag: undefined }))).toBe("flagged");
  });

  it("skips anything that is not a user's text message", async () => {
    expect(await moderateMessage(undefined)).toBe("skipped");
    expect(await moderateMessage(message({ type: "system" }))).toBe("skipped");
    expect(await moderateMessage(message({ text: "  " }))).toBe("skipped");
    expect(moderateChatMessage).not.toHaveBeenCalled();
  });
});
