"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { alexandria } from "./site-font";
import { RoadDashes } from "./RoadDashes";

/**
 * A road barrier — the error pages' picture: the way is closed for now, not
 * gone. Asphalt and marker stripes, as on a real Cairo road-works barrier.
 */
export function RoadBarrier({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative block h-24 w-56", className)}>
      <span className="absolute inset-x-0 top-0 h-10 rounded-[6px] border-2 border-border-strong bg-[repeating-linear-gradient(-45deg,var(--marker)_0_16px,var(--inverse)_16px_32px)] shadow-key" />
      <span className="absolute start-7 top-10 h-12 w-2.5 bg-inverse" />
      <span className="absolute end-7 top-10 h-12 w-2.5 bg-inverse" />
      <span className="absolute bottom-0 start-3 h-2 w-10 rounded-full bg-inverse" />
      <span className="absolute bottom-0 end-3 h-2 w-10 rounded-full bg-inverse" />
    </span>
  );
}

/**
 * Every error and not-found page in the brand (canvas language: Cairo
 * Plate): a picture, a plain headline, what happened and what to do, then
 * the way out — the marker-yellow action first.
 *
 * `fullPage` is for a page that renders outside the public site and the
 * dashboard (the locale-level error and 404 pages): it turns the site theme
 * and its face on itself and fills the screen. Inside a themed shell it sits
 * in the content area instead.
 */
export function ErrorScreen({
  art,
  title,
  body,
  reference,
  actions,
  fullPage = false,
}: {
  art: ReactNode;
  title: string;
  body: string;
  /** "Quote this reference" line, when the error carries a digest. */
  reference?: string;
  actions: ReactNode;
  fullPage?: boolean;
}) {
  const screen = (
    <div className={cn("flex w-full flex-1 items-center justify-center px-4", fullPage ? "min-h-screen py-16" : "py-16 md:py-24")}>
      <div className="flex w-full max-w-xl flex-col items-center gap-5 text-center">
        <div className="flex flex-col items-center gap-4">
          {art}
          <RoadDashes className="w-48 opacity-90" />
        </div>
        <h1 className="mt-2 text-h1 font-extrabold leading-tight">{title}</h1>
        <p className="max-w-[48ch] text-body text-muted-foreground">{body}</p>
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">{actions}</div>
        {reference && <p className="text-micro text-muted-foreground">{reference}</p>}
      </div>
    </div>
  );

  if (!fullPage) return screen;
  return (
    <div data-theme="site" className={cn(alexandria.variable, "flex min-h-screen flex-col bg-background text-foreground")}>
      {screen}
    </div>
  );
}
