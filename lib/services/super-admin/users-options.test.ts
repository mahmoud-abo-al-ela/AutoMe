import { describe, expect, it } from "vitest";
import { parseUserQuery, userQueryString } from "./users-options";

describe("users list query", () => {
  it("defaults everything that is missing", () => {
    expect(parseUserQuery({})).toEqual({ view: "all", search: "", dealership: null, sort: "newest", page: 1 });
  });

  it("keeps what it offers and drops what it doesn't", () => {
    expect(parseUserQuery({ view: "admins", search: " sara ", dealership: "a5956faa-1b02", sort: "active", page: "2" })).toEqual({
      view: "admins",
      search: "sara",
      dealership: "a5956faa-1b02",
      sort: "active",
      page: 2,
    });
    expect(parseUserQuery({ view: "banned", dealership: "x' OR 1=1", sort: "email", page: "0" })).toEqual({
      view: "all",
      search: "",
      dealership: null,
      sort: "newest",
      page: 1,
    });
  });

  it("reads back what it writes, and leaves defaults out", () => {
    expect(userQueryString({ view: "all", sort: "newest", page: 1 })).toBe("");
    const query = { view: "teams", search: "مو", dealership: "org-1", sort: "name", page: 3 } as const;
    expect(parseUserQuery(Object.fromEntries(new URLSearchParams(userQueryString(query))))).toEqual(query);
  });
});
