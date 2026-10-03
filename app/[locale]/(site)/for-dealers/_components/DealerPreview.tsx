import { getTranslations } from "next-intl/server";
import { Check, Languages, Sparkles } from "lucide-react";
import { PricePlate } from "@/components/brand";
import { Reveal, RevealItem } from "@/components/Home/motion/Reveal";

/** The sample listing's price — illustration, like the home story's. */
const SAMPLE_PRICE = 875_000;

/**
 * The dealer hero's second column: a glance at a showroom on AutoMe, built
 * from the home story's sample — a listing the AI wrote, a buyer's message
 * with its translation, a test drive booked. Illustration, not live data, so
 * it is hidden from assistive tech; the features below say the same in words.
 * The three cards rise in one after another and sit slightly staggered.
 */
export async function DealerPreview() {
  const t = await getTranslations("forDealers.preview");
  const tStory = await getTranslations("home.story");

  return (
    <div aria-hidden className="select-none">
      <Reveal className="flex flex-col gap-3 sm:gap-4">
        <RevealItem className="rounded-control bg-card p-4 text-foreground shadow-float sm:p-5 lg:me-10">
          <div className="flex items-center justify-between gap-3">
            <span className="text-body font-semibold" dir="ltr">
              {tStory("sampleCar")}
            </span>
            <PricePlate amount={SAMPLE_PRICE} size="sm" />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-caption font-semibold text-primary">
            <Sparkles className="size-4" />
            {t("aiWritten")}
          </p>
        </RevealItem>

        <RevealItem className="flex flex-col gap-2 rounded-control border border-inverse-foreground/15 bg-inverse-foreground/[0.06] p-4 sm:p-5 lg:ms-10">
          <p className="text-micro font-semibold text-inverse-foreground/60 sm:text-caption">{t("newMessage")}</p>
          {/* dir="auto" on the run, not the line: the other language reads in
              its own direction but stays aligned with the page's. */}
          <p className="text-h3 font-semibold">
            <span dir="auto">{tStory("chatFrom")}</span>
          </p>
          <p className="flex items-center gap-2 text-body text-marker">
            <Languages className="size-4 shrink-0" />
            <span dir="auto">{tStory("chatTo")}</span>
          </p>
        </RevealItem>

        <RevealItem className="w-fit lg:ms-24">
          <p className="flex items-center gap-2 rounded-control bg-marker px-4 py-2.5 text-caption font-bold text-marker-foreground shadow-key">
            <Check className="size-4" />
            {tStory("booked")}
          </p>
        </RevealItem>
      </Reveal>
    </div>
  );
}
