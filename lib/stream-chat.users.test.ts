import { describe, it, expect, vi, beforeEach } from "vitest";

const upsertUser = vi.hoisted(() => vi.fn());
vi.mock("stream-chat", () => ({ StreamChat: { getInstance: () => ({ upsertUser }) } }));

import { ensureOrgMembersInStream, upsertStreamUser } from "@/lib/stream-chat";

/**
 * Stream hands every channel member's user object — custom fields included —
 * to every other member. So a Stream user is how a person appears in chat and
 * nothing more: no email, Clerk id or platform role, for buyers or staff.
 */

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_STREAM_API_KEY = "key";
  process.env.STREAM_API_SECRET = "secret";
});

describe("Stream users", () => {
  it("carry an id, a name and a picture, and nothing else", async () => {
    // Extra fields as a caller might still pass them, from a full User row.
    await upsertStreamUser({ id: "u1", name: "Mona", image: null, email: "m@x.eg", custom: { clerk_id: "c1" } } as never);

    expect(upsertUser).toHaveBeenCalledWith({ id: "u1", name: "Mona", image: null });
  });

  it("show a nameless staff member under the dealership's name, not their email", async () => {
    await ensureOrgMembersInStream(
      [
        { id: "s1", name: null, imageUrl: null, email: "staff@dealer.eg", clerkId: "c2", role: "ADMIN" } as never,
        { id: "s2", name: "Omar", imageUrl: "https://img/o.png" },
      ],
      "Cairo Motors",
    );

    expect(upsertUser).toHaveBeenNthCalledWith(1, { id: "s1", name: "Cairo Motors", image: null });
    expect(upsertUser).toHaveBeenNthCalledWith(2, { id: "s2", name: "Omar", image: "https://img/o.png" });
  });
});
