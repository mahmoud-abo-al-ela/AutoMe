import { describe, it, expect, vi, beforeEach } from "vitest";

const { getMessage, queryChannels, partialUpdateMessage, translateChatMessage } = vi.hoisted(() => ({
  getMessage: vi.fn(),
  queryChannels: vi.fn(),
  partialUpdateMessage: vi.fn(),
  translateChatMessage: vi.fn(),
}));

vi.mock("@/lib/stream-chat", () => ({
  getStreamServerClient: () => ({ getMessage, queryChannels, partialUpdateMessage }),
}));
vi.mock("@/lib/services/ai", () => ({ translateChatMessage }));

import { translateMessageFor } from "@/lib/services/chat/translation";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

const ARABIC = "العربية لسه موجودة ولا اتباعت؟";

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    cid: "messaging:car-1",
    type: "regular",
    text: ARABIC,
    user: { id: "buyer" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getMessage.mockResolvedValue({ message: message() });
  queryChannels.mockResolvedValue([{ data: { organization_id: "org-1", created_by: { id: "buyer" } } }]);
  partialUpdateMessage.mockResolvedValue({});
  translateChatMessage.mockResolvedValue("Is the car still available or has it been sold?");
});

describe("translateMessageFor", () => {
  it("translates, bills no one's quota at low priority, and saves it on the message as its author", async () => {
    const text = await translateMessageFor("dealer", "m1", "en");

    expect(text).toBe("Is the car still available or has it been sold?");
    expect(translateChatMessage).toHaveBeenCalledWith(ARABIC, "en", "buyer", {
      organizationId: "org-1",
      userId: "dealer",
      priority: "low",
    });
    expect(partialUpdateMessage).toHaveBeenCalledWith(
      "m1",
      { set: { translations: { en: { text, source: ARABIC } } } },
      "buyer"
    );
  });

  it("knows who wrote the message from the channel: its creator is the buyer", async () => {
    getMessage.mockResolvedValue({ message: message({ text: "We can do 600k cash.", user: { id: "staff" } }) });
    await translateMessageFor("buyer", "m1", "ar");
    expect(translateChatMessage.mock.calls[0][2]).toBe("dealership");

    // No dealership on the channel: roles are unknown, not guessed.
    queryChannels.mockResolvedValue([{ data: { created_by: { id: "buyer" } } }]);
    await translateMessageFor("buyer", "m1", "ar");
    expect(translateChatMessage.mock.calls[1][2]).toBeNull();
  });

  it("asks Stream whether the caller is a member of the message's channel", async () => {
    await translateMessageFor("dealer", "m1", "en");
    const [filter, , options] = queryChannels.mock.calls[0];
    expect(filter).toEqual({ cid: { $eq: "messaging:car-1" }, members: { $in: ["dealer"] } });
    expect(options).toMatchObject({ user_id: "dealer" });
  });

  it("answers not found to a non-member, exactly as to a missing message", async () => {
    queryChannels.mockResolvedValue([]);
    await expect(translateMessageFor("outsider", "m1", "en")).rejects.toBeInstanceOf(NotFoundError);

    getMessage.mockRejectedValue(new Error("StreamChat error code 4"));
    await expect(translateMessageFor("outsider", "nope", "en")).rejects.toBeInstanceOf(NotFoundError);
    expect(translateChatMessage).not.toHaveBeenCalled();
  });

  it("serves a saved translation of the same text without calling the model", async () => {
    getMessage.mockResolvedValue({
      message: message({ translations: { en: { text: "Saved.", source: ARABIC } } }),
    });
    expect(await translateMessageFor("dealer", "m1", "en")).toBe("Saved.");
    expect(translateChatMessage).not.toHaveBeenCalled();
    expect(partialUpdateMessage).not.toHaveBeenCalled();
  });

  it("re-translates an edited message and drops translations of its old text", async () => {
    getMessage.mockResolvedValue({
      message: message({
        translations: {
          en: { text: "Old.", source: "نص قديم" },
          ar: { text: "stale", source: "old text" },
        },
      }),
    });
    await translateMessageFor("dealer", "m1", "en");
    expect(translateChatMessage).toHaveBeenCalled();
    const saved = partialUpdateMessage.mock.calls[0][1].set.translations;
    expect(Object.keys(saved)).toEqual(["en"]);
  });

  it("refuses a message already in the reader's language, or with nothing to translate", async () => {
    await expect(translateMessageFor("dealer", "m1", "ar")).rejects.toBeInstanceOf(ValidationError);

    getMessage.mockResolvedValue({ message: message({ text: "👍" }) });
    await expect(translateMessageFor("dealer", "m1", "en")).rejects.toBeInstanceOf(ValidationError);

    getMessage.mockResolvedValue({ message: message({ type: "deleted" }) });
    await expect(translateMessageFor("dealer", "m1", "en")).rejects.toBeInstanceOf(ValidationError);
    expect(translateChatMessage).not.toHaveBeenCalled();
  });

  it("still returns the translation when saving it fails", async () => {
    partialUpdateMessage.mockRejectedValue(new Error("Stream down"));
    expect(await translateMessageFor("dealer", "m1", "en")).toBe(
      "Is the car still available or has it been sold?"
    );
  });
});
