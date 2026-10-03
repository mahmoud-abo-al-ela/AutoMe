import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { CalendarCheck, Heart, MessageCircle, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DealerPitchOnly } from "@/components/brand";

const POINTS = {
  signIn: [
    ["saved", Heart],
    ["chats", MessageCircle],
    ["drives", CalendarCheck],
  ],
  signUp: [
    ["save", Heart],
    ["chat", MessageCircle],
    ["drive", CalendarCheck],
  ],
} as const satisfies Record<string, readonly (readonly [string, LucideIcon])[]>;

/**
 * Sign-in and sign-up: the Clerk card beside a photo panel in the home hero's
 * overlay (globals.css: .hero-*), saying what the account is for. The panel
 * is a wide-screen extra — on phones the card stands alone, carrying its own
 * title.
 *
 * The panel's headline is not a heading: Clerk's card title is the page's h1.
 */
export async function AuthShell({ mode, children }: { mode: keyof typeof POINTS; children: ReactNode }) {
  const t = await getTranslations(`auth.${mode}`);

  return (
    <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-12 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-16 xl:px-0">
      <aside className="relative isolate hidden min-h-[620px] flex-col justify-end gap-7 overflow-hidden rounded-hero bg-inverse p-10 text-inverse-foreground lg:flex xl:p-14">
        <Image src="/hero-car.jpg" alt="" fill sizes="50vw" className="-z-40 object-cover" />
        <div aria-hidden className="hero-wash absolute inset-0 -z-30" />
        <div aria-hidden className="hero-scrim absolute inset-0 -z-20" />
        <div aria-hidden className="hero-glow absolute inset-0 -z-10" />

        <p className="max-w-[17ch] text-h1 font-black xl:text-[2.875rem] xl:leading-[1.1]">
          {t("title")} <span className="text-marker">{t("accent")}</span>
        </p>
        <ul className="flex flex-col gap-3">
          {POINTS[mode].map(([key, Icon]) => (
            <li key={key} className="flex items-center gap-3 text-body sm:text-[1.0625rem]">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marker text-marker-foreground">
                <Icon className="size-[18px]" />
              </span>
              {t(`points.${key}`)}
            </li>
          ))}
        </ul>
        {mode === "signUp" && (
          <DealerPitchOnly>
            <p className="border-t border-inverse-foreground/15 pt-5 text-caption text-inverse-foreground/80">
              {t("dealer")}{" "}
              <Link href="/for-dealers" className="font-semibold text-marker hover:underline">
                {t("dealerLink")}
              </Link>
            </p>
          </DealerPitchOnly>
        )}
      </aside>

      <div className="flex justify-center lg:items-center">{children}</div>
    </div>
  );
}
