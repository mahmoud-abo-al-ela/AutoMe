import { getTranslations } from "next-intl/server";
import { CalendarCheck, Languages, MessageSquareText, Sparkles, Store, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { FaqAccordion, PageHeader } from "@/components/brand";
import { SectionHeader } from "@/components/Home/SectionHeader";
import { DealerBand } from "@/components/Home/DealerBand";
import { StartFreeButton } from "@/components/Home/StartFreeButton";
import { MotionRoot } from "@/components/Home/motion/MotionRoot";
import { Reveal, RevealBlock, RevealItem } from "@/components/Home/motion/Reveal";
import Pricing from "@/components/Pricing/Pricing";
import { getActivePlans } from "@/actions/billing";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { DealerPreview } from "./_components/DealerPreview";

type Props = { params: Promise<{ locale: string }> };

// Icons and order only; every string is in messages/{en,ar}/forDealers.json.
const FEATURES = [
  { key: "ai", icon: Sparkles },
  { key: "storefront", icon: Store },
  { key: "chat", icon: Languages },
  { key: "assistant", icon: MessageSquareText },
  { key: "drive", icon: CalendarCheck },
  { key: "team", icon: Users },
] as const;

const BILLING_QUESTIONS = ["trial", "payment", "change", "limits", "storefront"] as const;

const container = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 xl:px-0";

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forDealers.meta" });

  return localizedPageMetadata("/for-dealers", locale as Locale, {
    title: t("title"),
    description: t("description"),
  });
}

/**
 * The page for dealerships: what AutoMe does for a showroom, the plans, and
 * the billing questions — everything the home page used to carry for dealers
 * below the buyer's content. The header's "For dealers", the footer and the
 * home page's dealer band all lead here; "See plans" lands on `#plans`.
 *
 * Marketplace only: a dealership's subdomain is its storefront, with no
 * sign-up pitch on it, so the middleware sends a visit there on to the main
 * domain (lib/route-policy: MAIN_DOMAIN_ONLY_ROUTES).
 */
export default async function ForDealersPage() {
  const t = await getTranslations("forDealers");
  const tBand = await getTranslations("home.dealerBand");
  const plansResponse = await getActivePlans();
  const plans = plansResponse.success ? plansResponse.data : null;

  return (
    <MotionRoot>
      <div className="flex flex-col">
        <PageHeader
          tone="inverse"
          eyebrow={t("hero.eyebrow")}
          title={t("hero.title")}
          accent={t("hero.accent")}
          subtitle={t("hero.subtitle")}
          aside={<DealerPreview />}
        >
          <StartFreeButton label={tBand("startFree")} variant="marker" />
          <a
            href="#plans"
            className={buttonVariants({
              variant: "outline",
              size: "xl",
              className:
                "border-inverse-foreground/35 bg-transparent text-inverse-foreground hover:bg-inverse-foreground/10 hover:text-inverse-foreground",
            })}
          >
            {t("hero.seePlans")}
          </a>
        </PageHeader>

        <section aria-labelledby="dealer-features-title" className={`${container} pt-12 sm:pt-16`}>
          <RevealBlock>
            <SectionHeader id="dealer-features-title" title={t("features.title")} />
          </RevealBlock>
          <Reveal as="ul" className="grid grid-cols-1 gap-px overflow-hidden rounded-sheet border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon }) => (
              <RevealItem key={key} as="li" className="flex flex-col gap-3 bg-card p-6 sm:p-8">
                <span aria-hidden className="flex size-12 items-center justify-center rounded-full border-2 border-border-strong bg-marker">
                  <Icon className="size-[22px]" />
                </span>
                <h3 className="text-h3 font-semibold">{t(`features.${key}Title`)}</h3>
                <p className="text-body text-muted-foreground">{t(`features.${key}Body`)}</p>
              </RevealItem>
            ))}
          </Reveal>
        </section>

        <div className={`${container} pt-12 sm:pt-16`}>
          <RevealBlock>
            <Pricing plans={plans} />
          </RevealBlock>
        </div>

        <section aria-labelledby="dealer-faq-title" className={`${container} pt-12 sm:pt-16`}>
          <RevealBlock className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <div className="flex flex-col gap-3">
              <h2 id="dealer-faq-title" className="text-h1 font-extrabold">
                {t("faq.title")}
              </h2>
              <p className="text-body text-muted-foreground">
                {t("faq.subtitle")}{" "}
                <Link href="/contact" className="font-semibold text-primary hover:underline">
                  {t("faq.contactUs")}
                </Link>
              </p>
            </div>
            <FaqAccordion
              items={BILLING_QUESTIONS.map((key) => ({
                id: key,
                question: t(`faq.${key}Q`),
                answer: t(`faq.${key}A`),
              }))}
            />
          </RevealBlock>
        </section>

        <section aria-labelledby="dealers-cta-title" className={`${container} pb-16 pt-12 sm:pb-24 sm:pt-16`}>
          <RevealBlock>
            <DealerBand variant="page" />
          </RevealBlock>
        </section>
      </div>
    </MotionRoot>
  );
}
