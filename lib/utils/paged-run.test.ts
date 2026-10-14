import { describe, it, expect, vi } from "vitest";
import { runAllPages } from "@/lib/utils/paged-run";

describe("runAllPages", () => {
  it("walks every page from the start, passing each cursor on", async () => {
    const page = vi
      .fn<(after?: string) => Promise<{ n: number; next: string | null }>>()
      .mockResolvedValueOnce({ n: 2, next: "a" })
      .mockResolvedValueOnce({ n: 2, next: "b" })
      .mockResolvedValueOnce({ n: 1, next: null });

    const { results, finished } = await runAllPages(page, Date.now() + 60_000);

    expect(page.mock.calls).toEqual([[undefined], ["a"], ["b"]]);
    expect(results.map((r) => r.n)).toEqual([2, 2, 1]);
    expect(finished).toBe(true);
  });

  it("stops starting pages once the deadline passes, and says it did not finish", async () => {
    const page = vi.fn().mockResolvedValue({ next: "more" });

    const { results, finished } = await runAllPages(page, Date.now() - 1);

    // One page always runs; none after the deadline.
    expect(results).toHaveLength(1);
    expect(finished).toBe(false);
  });
});
