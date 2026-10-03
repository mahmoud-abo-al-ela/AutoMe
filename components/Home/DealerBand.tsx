import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { StartFreeButton } from "./StartFreeButton";

/**
 * The dealership pitch, kept to one band at the end of the buyer's page
 * (Figma: Home — For dealers band). Marker yellow with asphalt text — the
 * site's loudest surface, used once.
 *
 * Sits inside the `#for-dealers` section the header's "For dealers" link
 * targets; the plans follow directly below it.
 */
export async function DealerBand() {
  const t = await getTranslations("home.dealerBand");

  return (
    <div className="flex flex-col gap-8 rounded-sheet bg-marker p-6 text-marker-foreground sm:p-10 md:rounded-hero lg:flex-row lg:items-center lg:p-16">
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-caption font-semibold">{t("eyebrow")}</p>
        <h2 id="for-dealers-title" className="text-h1 font-black">
          {t("title")}
        </h2>
        <p className="max-w-[40rem] text-body sm:text-[1.0625rem]">{t("description")}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row lg:w-80 lg:flex-col">
        <StartFreeButton label={t("startFree")} className="flex-1 lg:flex-none" />
        <Button variant="outline-strong" size="xl" asChild className="flex-1 bg-transparent hover:bg-marker-hover lg:flex-none">
          <a href="#pricing">{t("seePlans")}</a>
        </Button>
      </div>
    </div>
  );
}
