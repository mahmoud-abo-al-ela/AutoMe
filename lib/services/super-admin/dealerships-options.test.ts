import { describe, expect, it } from "vitest";
import { dealershipQueryString, parseDealershipQuery } from "./dealerships-options";

describe("dealerships list query", () => {
  it("defaults everything that is missing", () => {
    expect(parseDealershipQuery({})).toEqual({ view: "all", search: "", plan: null, region: null, sort: "newest", page: 1 });
  });

  it("keeps what it offers and drops what it doesn't", () => {
    expect(
      parseDealershipQuery({ view: "overdue", search: "  nile ", plan: "PRO", region: "CAI", sort: "cars", page: "3" }),
    ).toEqual({ view: "overdue", search: "nile", plan: "PRO", region: "CAI", sort: "cars", page: 3 });
    expect(parseDealershipQuery({ view: "deleted", plan: "GOLD", region: "cairo; drop", sort: "paid", page: "-2" })).toEqual({
      view: "all",
      search: "",
      plan: null,
      region: null,
      sort: "newest",
      page: 1,
    });
  });

  it("takes the first of repeated params and caps the search", () => {
    const query = parseDealershipQuery({ view: ["trial", "overdue"], search: "x".repeat(300) });
    expect(query.view).toBe("trial");
    expect(query.search).toHaveLength(100);
  });

  it("leaves defaults out of the URL", () => {
    expect(dealershipQueryString({ view: "all", sort: "newest", page: 1 })).toBe("");
    expect(dealershipQueryString({ view: "noCars", search: "مو", plan: "STARTER", page: 2 })).toBe(
      `?view=noCars&search=${encodeURIComponent("مو")}&plan=STARTER&page=2`,
    );
  });

  it("reads back what it writes", () => {
    const query = { view: "suspended", search: "delta", plan: "ENTERPRISE", region: "DK", sort: "name", page: 4 } as const;
    const params = Object.fromEntries(new URLSearchParams(dealershipQueryString(query)));
    expect(parseDealershipQuery(params)).toEqual(query);
  });
});
