import { describe, it, expect, vi, beforeEach } from "vitest";

const subdomain = vi.hoisted(() => ({ value: null as string | null }));

vi.mock("next/headers", () => ({
  headers: async () => new Map([["x-subdomain", subdomain.value]].filter(([, v]) => v) as [string, string][]),
}));
vi.mock("@/lib/utils/page-seo", () => ({ requestOrigin: async () => "https://auto-me.vercel.app" }));
vi.mock("@/lib/services/sitemap", () => ({ getSitemapListings: vi.fn() }));
vi.mock("@/lib/utils/errors", () => ({ logError: vi.fn() }));

import sitemap from "./sitemap";
import { getSitemapListings } from "@/lib/services/sitemap";
import { logError } from "@/lib/utils/errors";

const urls = (entries: { url: string }[]) => entries.map((e) => e.url);

describe("sitemap", () => {
  beforeEach(() => {
    subdomain.value = null;
    vi.mocked(getSitemapListings).mockReset();
    vi.mocked(logError).mockReset();
  });

  it("lists the marketplace pages, dealerships and cars, in every locale", async () => {
    vi.mocked(getSitemapListings).mockResolvedValue({
      cars: [{ id: "car-1", updatedAt: new Date("2026-10-01") }],
      dealerships: [{ slug: "nile-motors", updatedAt: new Date("2026-09-01") }],
    });
    const listed = urls(await sitemap());
    expect(listed).toContain("https://auto-me.vercel.app/en/cars");
    expect(listed).toContain("https://auto-me.vercel.app/ar/dealerships/nile-motors");
    expect(listed).toContain("https://auto-me.vercel.app/en/cars/car-1");
  });

  it("lists only the storefront on a dealership's subdomain, without reading the database", async () => {
    subdomain.value = "nile-motors";
    const listed = urls(await sitemap());
    expect(listed.every((url) => /\/(en|ar)(\/cars)?$/.test(url))).toBe(true);
    expect(getSitemapListings).not.toHaveBeenCalled();
  });

  it("serves the static pages, and logs, when the listings cannot be read", async () => {
    vi.mocked(getSitemapListings).mockRejectedValue(new Error("database down"));
    const listed = urls(await sitemap());
    expect(listed).toContain("https://auto-me.vercel.app/en/faq");
    expect(listed.some((url) => url.includes("/cars/"))).toBe(false);
    expect(logError).toHaveBeenCalledOnce();
  });
});
