import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import superAdmin from "@/messages/en/superAdmin.json";

// The real Link needs Next's router; this one shows what the Pager hands it.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, scroll, children, ...rest }: { href: string; scroll?: boolean; children: React.ReactNode }) => (
    <a href={href} data-scroll={String(scroll)} {...rest}>
      {children}
    </a>
  ),
}));

import { Pager } from "./Pager";

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={{ superAdmin }} timeZone="Africa/Cairo">
      {node}
    </NextIntlClientProvider>
  );

const href = (page: number) => `/list?page=${page}`;

describe("Pager", () => {
  it("is nothing for a single page", () => {
    expect(render(<Pager page={1} pages={1} href={href} />)).toBe("");
  });

  it("keeps the reader's place by default, as a tab does", () => {
    const html = render(<Pager page={2} pages={3} href={href} />);
    expect(html).toContain('href="/list?page=1"');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('data-scroll="true"');
    expect(html).toContain('data-scroll="false"');
  });

  it("sends a full-page list back to the top, with the list's link colour", () => {
    const html = render(<Pager page={2} pages={3} href={href} scroll linkClassName="text-foreground" />);
    expect(html).not.toContain('data-scroll="false"');
    expect(html).toContain("text-foreground");
    // The current page keeps its own colours over the added one.
    expect(html).toMatch(/aria-current="page"[^>]*text-inverse-foreground|text-inverse-foreground[^>]*aria-current="page"/);
  });

  it("shows the first, last and neighbouring pages of a long run, with gaps", () => {
    const html = render(<Pager page={6} pages={12} href={href} />);
    for (const page of [1, 5, 6, 7, 12]) expect(html).toContain(`href="/list?page=${page}"`);
    expect(html).not.toContain('href="/list?page=3"');
    expect(html).toContain("…");
  });
});
