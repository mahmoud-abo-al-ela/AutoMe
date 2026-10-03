import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StartFreeButton } from "./StartFreeButton";

/**
 * The dealership pitch as one band (Figma: Home — For dealers band). Marker
 * yellow with asphalt text — the site's loudest surface, used once per page.
 *
 * - `home`: closes the buyer's home page and points dealers to /for-dealers,
 *   where the plans are.
 * - `page`: the closing call to action on /for-dealers itself, with a way to
 *   talk to us first.
 *
 * Links styled as buttons with buttonVariants, not <Button asChild>: in a
 * Server Component the i18n Link suspends on the locale and Radix Slot
 * renders nothing for it.
 */
export async function DealerBand({ variant = "home" }: { variant?: "home" | "page" }) {
  const t = await getTranslations("home.dealerBand");
  const tPage = await getTranslations("forDealers.cta");
  const home = variant === "home";

  return (
    <div className="relative isolate flex flex-col gap-8 overflow-hidden rounded-sheet bg-marker p-6 text-marker-foreground sm:p-10 md:rounded-hero lg:flex-row lg:items-center lg:p-16">
      {/* Hazard stripes sliding slowly across the band (globals.css). */}
      <div aria-hidden className="hazard-stripes absolute inset-0 -z-10" />
      <div className="flex flex-1 flex-col gap-3">
        {home && <p className="text-caption font-semibold">{t("eyebrow")}</p>}
        <h2 id={home ? "for-dealers-title" : "dealers-cta-title"} className="text-h1 font-black">
          {home ? t("title") : tPage("title")}
        </h2>
        <p className="max-w-[40rem] text-body sm:text-[1.0625rem]">{home ? t("description") : tPage("description")}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row lg:w-80 lg:flex-col">
        <StartFreeButton label={t("startFree")} className="flex-1 lg:flex-none" />
        <Link
          href={home ? "/for-dealers" : "/contact"}
          className={cn(
            buttonVariants({ variant: "outline-strong", size: "xl" }),
            "flex-1 bg-transparent hover:bg-marker-hover lg:flex-none",
          )}
        >
          {home ? t("seePlans") : tPage("contact")}
        </Link>
      </div>
    </div>
  );
}
