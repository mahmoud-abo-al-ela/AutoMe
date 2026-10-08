import { describe, expect, it } from "vitest";
import { parsePlatformActivityQuery, platformActivityQueryString } from "./platform-activity-options";

describe("activity query", () => {
  it("defaults everything that is missing", () => {
    expect(parsePlatformActivityQuery({})).toEqual({ search: "", who: "all", kind: "all", dealership: null, days: "all", page: 1 });
  });

  it("keeps what it offers and drops what it doesn't", () => {
    expect(parsePlatformActivityQuery({ search: " sara ", who: "support", kind: "cars", dealership: "a5956faa-1b02", days: "30", page: "3" })).toEqual({
      search: "sara",
      who: "support",
      kind: "cars",
      dealership: "a5956faa-1b02",
      days: "30",
      page: 3,
    });
    expect(parsePlatformActivityQuery({ who: "robots", kind: "logins", dealership: "x' OR 1=1", days: "365", page: "0" })).toEqual({
      search: "",
      who: "all",
      kind: "all",
      dealership: null,
      days: "all",
      page: 1,
    });
  });

  it("reads back what it writes, and leaves defaults out", () => {
    expect(platformActivityQueryString({ who: "all", kind: "all", days: "all", page: 1 })).toBe("");
    const query = { search: "معرض", who: "staff", kind: "sessions", dealership: "org-1", days: "7", page: 2 } as const;
    expect(parsePlatformActivityQuery(Object.fromEntries(new URLSearchParams(platformActivityQueryString(query))))).toEqual(query);
  });
});
