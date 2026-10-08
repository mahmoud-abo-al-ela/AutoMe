"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLocale, useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { localeDirection, type Locale } from "@/i18n/routing";
import { SectionHeader } from "@/components/Home/SectionHeader";
import { SCENES, sceneTimeline, type SceneKind } from "./scenes";

gsap.registerPlugin(ScrollTrigger, useGSAP);
// Phones show and hide the address bar as you scroll, which resizes the
// viewport; without this every resize would recompute the pin and jump it.
ScrollTrigger.config({ ignoreMobileResize: true });

const COPY = [
  ["priceTitle", "priceBody"],
  ["askTitle", "askBody"],
  ["chatTitle", "chatBody"],
  ["driveTitle", "driveBody"],
] as const;

const LAST = SCENES.length - 1;

// The sticky header's height (MainHeader: h-14, md:h-[72px]); the frame pins
// right under it.
const headerOffset = () => (window.matchMedia("(min-width: 768px)").matches ? 72 : 56);

/**
 * "What you get on AutoMe", told as a story of four steps (GSAP).
 *
 * The section pins under the header and fills the screen, and scrolling —
 * wheel or touch — moves between steps: one scroll forward is the next step,
 * one back the previous, settling on each. A step plays on its own once it is
 * shown: the price needle swings into "fair", a question gets an instant
 * answer, a message flips to the other language, a test drive is booked and
 * the car drives off. The road fills as you go; its stops jump to a step.
 *
 * Two columns from lg; below that the stage sits on top with the step under
 * it, the frame fitting between the header and the phone tab bar
 * (globals.css: .story-frame). Reduced motion gets the steps stacked, each
 * scene shown finished (.story-pinned / .story-static, decided in CSS so the
 * right layout paints before JavaScript).
 */
export function ScrollStory() {
  const t = useTranslations("home.features");
  const fmt = useFormatters();
  const rtl = localeDirection[useLocale() as Locale] === "rtl";
  const root = useRef<HTMLElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);

  const number = (i: number) => fmt.number(i + 1);

  // A road stop jumps to its step. Instantly, not smooth-scrolled, so the snap
  // never catches it partway; the step's own crossfade carries the change.
  const goTo = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    window.scrollTo({ top: st.start + ((st.end - st.start) * i) / LAST, behavior: "instant" });
  };

  useGSAP(
    () => {
      const dir = rtl ? -1 : 1;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(pinned);
        const chapters = q("[data-chapter]");
        const scenes = q("[data-stage-scene]");
        const stops = q("[data-step-stop]");
        const fill = q("[data-progress]");
        const plays = SCENES.map(({ kind }, i) => sceneTimeline(scenes[i], kind, dir).pause());

        let current = -1;
        const show = (i: number) => {
          if (i === current) return;
          const prev = current;
          current = i;
          const shift = prev < 0 ? 0 : i > prev ? 1 : -1;

          if (prev >= 0) {
            gsap.to([chapters[prev], scenes[prev]], { autoAlpha: 0, y: -28 * shift, duration: 0.3, overwrite: true });
          }
          gsap.fromTo(
            [chapters[i], scenes[i]],
            { autoAlpha: prev < 0 ? 1 : 0, y: 28 * shift },
            { autoAlpha: 1, y: 0, duration: 0.45, delay: prev < 0 ? 0 : 0.15, ease: "power2.out", overwrite: true }
          );
          stops.forEach((stop, k) => {
            stop.setAttribute("aria-current", k === i ? "step" : "false");
            gsap.to(stop, {
              backgroundColor: k <= i ? "var(--marker)" : "var(--card)",
              scale: k === i ? 1.35 : 1,
              duration: 0.3,
              overwrite: true,
            });
          });
          // The step plays on its own, from the start, each time it is shown.
          plays[i].delay(prev < 0 ? 0 : 0.3).restart(true);
        };

        trigger.current = ScrollTrigger.create({
          trigger: pinned.current,
          // Right under the sticky header; the frame is exactly the rest of the
          // screen tall, so nothing empty shows above or below it.
          start: () => `top top+=${headerOffset()}`,
          end: () => `+=${window.innerHeight * 1.8}`,
          pin: true,
          // Settle on a step: any scroll forward lands on the next one, any
          // scroll back on the previous — measured from where the page is now.
          // (GSAP's own directional snap steps from the last resting point, so
          // a long jump, like a road stop, only ever moved one step.)
          snap: {
            snapTo: (value, self) => {
              const steps = value * LAST;
              const target = (self?.direction ?? 1) > 0 ? Math.ceil(steps - 0.02) : Math.floor(steps + 0.02);
              return Math.min(LAST, Math.max(0, target)) / LAST;
            },
            directional: false,
            duration: { min: 0.25, max: 0.5 },
            delay: 0.05,
            ease: "power2.inOut",
          },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(fill, { scaleX: self.progress });
            show(Math.round(self.progress * LAST));
          },
        });

        // The first step plays as the section scrolls into view, before the pin.
        ScrollTrigger.create({
          trigger: pinned.current,
          start: "top 65%",
          once: true,
          onEnter: () => show(0),
        });

        return () => {
          trigger.current = null;
        };
      });

      // Reduced motion: the stacked steps, each scene set to its finished
      // state at once — no movement, just the end of the story.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.utils.toArray<HTMLElement>("[data-static-scene]", root.current).forEach((scene) => {
          sceneTimeline(scene, scene.dataset.kind as SceneKind, dir).progress(1);
        });
      });
    },
    { scope: root, dependencies: [rtl] }
  );

  return (
    <section ref={root} aria-labelledby="story-title" className="pt-12 sm:pt-16">
      {/* The static layout's title; the pinned frame carries its own, so it
          stays on screen with the steps. The section is named by this one. */}
      <div className="story-static mx-auto w-full max-w-[1360px] px-4 sm:px-6 xl:px-0">
        <SectionHeader id="story-title" title={t("title")} className="mb-0 sm:mb-0" />
      </div>

      {/* Pinned under the header; scrolling steps through. */}
      <div ref={pinned} className="story-pinned">
        <div className="story-frame mx-auto flex w-full max-w-[1360px] flex-col gap-4 px-4 py-4 sm:px-6 md:gap-6 md:py-8 xl:px-0">
          <SectionHeader title={t("title")} className="mb-0 sm:mb-0" />

          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-1 lg:gap-16">
            <div className="order-2 flex flex-col justify-center gap-6 lg:order-1 lg:gap-10">
              <div className="grid [grid-template-areas:'stack']">
                {COPY.map(([title, body], i) => (
                  <div key={title} data-chapter className="flex flex-col gap-2 [grid-area:stack] lg:gap-4">
                    <span className="w-fit rounded-plate border-2 border-border-strong bg-field px-2 text-body font-black tabular-nums shadow-key lg:px-2.5 lg:text-h3">
                      {number(i)}
                    </span>
                    <h3 className="text-h2 font-extrabold lg:text-h1">{t(title)}</h3>
                    <p className="max-w-md text-caption text-muted-foreground sm:text-body lg:text-[1.0625rem]">{t(body)}</p>
                  </div>
                ))}
              </div>

              <nav aria-label={t("title")} className="relative max-w-md">
                <div aria-hidden className="h-1.5 rounded-full bg-border" />
                <div
                  aria-hidden
                  data-progress
                  style={{ transform: "scaleX(0)" }}
                  className="absolute inset-x-0 top-0 h-1.5 origin-left rounded-full bg-marker rtl:origin-right"
                />
                <ol className="absolute inset-x-0 -top-[13px] flex justify-between">
                  {COPY.map(([title], i) => (
                    <li key={title}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={t(title)}
                        className="group flex size-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <span
                          data-step-stop
                          className="block size-4 rounded-full border-2 border-border-strong bg-card transition-transform group-hover:scale-125"
                        />
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <div className="relative order-1 grid h-full min-h-0 overflow-hidden rounded-sheet bg-inverse text-inverse-foreground [grid-template-areas:'stack'] lg:order-2 lg:rounded-hero">
              <div aria-hidden className="hazard-stripes absolute inset-0 opacity-30" />
              {SCENES.map(({ kind, Scene }, i) => (
                <div key={kind} data-stage-scene className="relative flex items-center justify-center overflow-hidden p-5 [grid-area:stack] lg:p-10">
                  {/* The step's number, huge and faint, filling the stage. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-6 end-4 select-none text-[8rem] font-black leading-none tabular-nums text-inverse-foreground/[0.06] lg:-bottom-12 lg:end-6 lg:text-[15rem]"
                  >
                    {number(i)}
                  </span>
                  <div className="relative w-full max-w-sm lg:scale-[1.2] xl:scale-[1.35]">
                    <Scene />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reduced motion: the steps stacked, each scene shown finished. */}
      <ol className="story-static mx-auto flex w-full max-w-[1360px] flex-col gap-10 px-4 pt-8 sm:px-6 xl:px-0">
        {SCENES.map(({ kind, Scene }, i) => (
          <li key={kind} className="grid grid-cols-1 items-center gap-5 md:grid-cols-2 md:gap-10">
            <div className="flex flex-col gap-3">
              <span className="w-fit rounded-plate border-2 border-border-strong bg-field px-2 text-body font-black tabular-nums shadow-key">
                {number(i)}
              </span>
              <h3 className="text-h2 font-extrabold">{t(COPY[i][0])}</h3>
              <p className="text-body text-muted-foreground">{t(COPY[i][1])}</p>
            </div>
            <div
              data-static-scene
              data-kind={kind}
              className="flex min-h-[260px] items-center justify-center rounded-sheet bg-inverse p-6 text-inverse-foreground"
            >
              <Scene />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
