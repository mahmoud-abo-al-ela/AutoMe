"use client";

import gsap from "gsap";
import type { ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Car, Check, Languages, Sparkles } from "lucide-react";
import { PricePlate } from "@/components/brand";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * The four scenes of the home scroll story (ScrollStory), one per feature:
 * a fair-price check, asking the listing, bilingual chat, a test drive.
 * Each is plain markup with data-* hooks, plus a GSAP timeline that plays it
 * — added to the pinned, scrubbed master timeline on desktop, or played once
 * on its own as the scene scrolls in on phones.
 *
 * The sample car and prices are illustration, not a live listing.
 */

export type SceneKind = "price" | "ask" | "chat" | "drive";

const SAMPLE_PRICE = 875_000;

export function PriceScene() {
  const t = useTranslations("home.story");
  const tMarket = useTranslations("common.market");
  return (
    <div className="w-full max-w-sm rounded-control bg-card p-5 text-foreground shadow-float">
      <div className="flex items-center justify-between gap-3">
        <span className="text-body font-semibold" dir="ltr">
          {t("sampleCar")}
        </span>
        <PricePlate amount={SAMPLE_PRICE} size="sm" />
      </div>
      <div className="relative mt-6">
        <div className="flex h-3 overflow-hidden rounded-full">
          <span className="flex-1 bg-positive" />
          <span className="flex-1 bg-muted" />
          <span className="flex-1 bg-destructive" />
        </div>
        <span data-needle className="absolute inset-x-0 -top-1.5 block">
          <span className="block h-6 w-1 rounded-full bg-foreground shadow-key" />
        </span>
      </div>
      <p data-verdict className="mt-4 flex items-center gap-2 text-caption font-semibold text-positive">
        <Check aria-hidden className="size-4" />
        {tMarket("fair")}
      </p>
    </div>
  );
}

export function AskScene() {
  const t = useTranslations("home.story");
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <p data-q className="max-w-[85%] self-end rounded-control rounded-ee-plate bg-marker px-4 py-3 text-caption font-medium text-marker-foreground">
        {t("askQ")}
      </p>
      <span data-typing className="flex w-fit gap-1.5 rounded-control bg-inverse-foreground/10 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} data-dot className="size-2 rounded-full bg-inverse-foreground/70" />
        ))}
      </span>
      <p data-a className="flex max-w-[90%] items-start gap-2 rounded-control rounded-es-plate bg-card px-4 py-3 text-caption text-foreground">
        <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        {t("askA")}
      </p>
    </div>
  );
}

export function ChatScene() {
  const t = useTranslations("home.story");
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 [perspective:900px]">
      <div className="relative w-full [transform-style:preserve-3d]" data-card>
        <p className="rounded-control bg-card px-5 py-4 text-center text-h3 font-semibold text-foreground [backface-visibility:hidden]" dir="auto">
          {t("chatFrom")}
        </p>
        <p
          className="absolute inset-0 flex items-center justify-center rounded-control bg-marker px-5 py-4 text-center text-h3 font-semibold text-marker-foreground [backface-visibility:hidden] [transform:rotateX(180deg)]"
          dir="auto"
        >
          {t("chatTo")}
        </p>
      </div>
      <span data-translated className="flex items-center gap-2 text-caption font-semibold text-inverse-foreground/80">
        <Languages aria-hidden className="size-4" />
        {t("translated")}
      </span>
    </div>
  );
}

export function DriveScene() {
  const t = useTranslations("home.story");
  const fmt = useFormatters();
  const locale = useLocale();
  // The weekday alone — a demo calendar, not a real date. A fixed Saturday in
  // UTC, so the server and the browser print the same day.
  const day = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, 0, 3, 12))
  );
  const slots = ["10:00", "12:30", "17:00"];
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-caption font-semibold text-inverse-foreground/80">{day}</p>
      <div className="flex gap-2">
        {slots.map((slot, i) => (
          <span
            key={slot}
            data-slot={i}
            className="flex-1 rounded-control border-2 border-inverse-foreground/25 py-2.5 text-center text-caption font-semibold"
          >
            {fmt.clockTime(slot)}
          </span>
        ))}
      </div>
      <p data-booked className="flex w-fit items-center gap-2 rounded-control bg-marker px-4 py-2.5 text-caption font-bold text-marker-foreground shadow-key">
        <Check aria-hidden className="size-4" />
        {t("booked")}
      </p>
      <div className="relative mt-2 h-10">
        <span aria-hidden className="road-run absolute inset-x-0 bottom-0 block h-1.5 rounded-full" />
        <span data-car className="absolute inset-x-0 bottom-1.5 block">
          <Car aria-hidden className="size-8 fill-marker text-inverse-foreground rtl:-scale-x-100" strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

/**
 * The timeline that plays one scene. `dir` is 1 for left-to-right pages and
 * -1 for Arabic, so motion along the line runs toward the reading end.
 * Starting states are set here too, so a scene is always built and played
 * from the same place.
 */
export function sceneTimeline(scene: Element, kind: SceneKind, dir: 1 | -1) {
  const q = gsap.utils.selector(scene);
  const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.5 } });

  if (kind === "price") {
    tl.fromTo(q("[data-needle]"), { xPercent: 2 * dir }, { xPercent: 50 * dir, duration: 0.9, ease: "back.out(1.6)" })
      .fromTo(q("[data-verdict]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0 }, "-=0.25");
  }

  if (kind === "ask") {
    tl.fromTo(q("[data-q]"), { autoAlpha: 0, y: 18, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1 })
      .fromTo(q("[data-typing]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
      .fromTo(q("[data-dot]"), { y: 0 }, { y: -5, duration: 0.25, stagger: 0.1, yoyo: true, repeat: 1 })
      .to(q("[data-typing]"), { autoAlpha: 0, duration: 0.15 })
      .fromTo(q("[data-a]"), { autoAlpha: 0, y: 18, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1 });
  }

  if (kind === "chat") {
    tl.fromTo(q("[data-card]"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 })
      .fromTo(q("[data-translated]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
      .fromTo(q("[data-card]"), { rotateX: 0 }, { rotateX: 180, duration: 0.8, ease: "power3.inOut" }, "+=0.2");
  }

  if (kind === "drive") {
    tl.fromTo(q("[data-slot]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.08 })
      .to(q('[data-slot="1"]'), {
        backgroundColor: "var(--marker)",
        borderColor: "var(--border-strong)",
        color: "var(--marker-foreground)",
        duration: 0.3,
      })
      .fromTo(q("[data-booked]"), { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, ease: "back.out(2)" })
      .fromTo(q("[data-car]"), { xPercent: -5 * dir }, { xPercent: 88 * dir, duration: 1.2, ease: "power1.inOut" }, "-=0.2");
  }

  return tl;
}

export const SCENES: { kind: SceneKind; Scene: () => ReactElement }[] = [
  { kind: "price", Scene: PriceScene },
  { kind: "ask", Scene: AskScene },
  { kind: "chat", Scene: ChatScene },
  { kind: "drive", Scene: DriveScene },
];
