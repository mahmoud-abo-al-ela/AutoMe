import { describe, expect, it } from "vitest";
import { parseSessionQuery, sessionQueryString } from "./sessions-options";

describe("support sessions query", () => {
  it("defaults everything that is missing", () => {
    expect(parseSessionQuery({})).toEqual({ view: "all", search: "", admin: null, days: "all", page: 1 });
  });

  it("keeps what it offers and drops what it doesn't", () => {
    expect(parseSessionQuery({ view: "open", search: " pricing ", admin: "user_2abc", days: "30", page: "2" })).toEqual({
      view: "open",
      search: "pricing",
      admin: "user_2abc",
      days: "30",
      page: 2,
    });
    expect(parseSessionQuery({ view: "closed", admin: "x' OR 1=1", days: "14", page: "-3" })).toEqual({
      view: "all",
      search: "",
      admin: null,
      days: "all",
      page: 1,
    });
  });

  it("reads back what it writes, and leaves defaults out", () => {
    expect(sessionQueryString({ view: "all", days: "all", page: 1 })).toBe("");
    const query = { view: "mine", search: "معرض", admin: "admin-1", days: "7", page: 4 } as const;
    expect(parseSessionQuery(Object.fromEntries(new URLSearchParams(sessionQueryString(query))))).toEqual(query);
  });
});
