import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { formatNumber } from "@/lib/utils/number";
import { MAX_COMPARE_CARS } from "@/lib/utils";
import { FAQ_AI_POINTS, FAQ_CATEGORIES, type FaqItemKey } from "./_lib/faq-items";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq.meta" });

  return localizedPageMetadata("/faq", locale as Locale, {
    title: t("title"),
    description: t("description"),
  });
}

export default async function FAQ({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const organization = await getCurrentOrganization();
  const brand = organization?.name || "AutoMe";

  const answer = (key: FaqItemKey): ReactNode => {
    switch (key) {
      case "compare":
        // Formatted first and interpolated as a string: a raw number would
        // render in Western digits on the Arabic page (see lib/utils/number).
        return t("items.compare.a", {
          count: MAX_COMPARE_CARS,
          max: formatNumber(MAX_COMPARE_CARS, locale as Locale),
        });
      case "security":
        return t.rich("items.security.a", {
          brand,
          link: (chunks) => (
            <Link
              href="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {chunks}
            </Link>
          ),
        });
      case "ai":
        return (
          <>
            <p>{t("items.ai.a", { brand })}</p>
            <ul className="mt-2 list-disc space-y-1 ps-5">
              {FAQ_AI_POINTS.map((point) => (
                <li key={point}>{t(`items.ai.points.${point}`)}</li>
              ))}
            </ul>
          </>
        );
      default:
        return t(`items.${key}.a`, { brand });
    }
  };

  return (
    <div className="container py-12 max-w-4xl mx-auto mt-12">
      <h1 className="text-4xl font-bold text-center mb-2">{t("title")}</h1>
      <p className="text-center text-muted-foreground mb-8">
        {t("subtitle", { brand })}
      </p>

      <div className="space-y-10">
        {FAQ_CATEGORIES.map((category) => (
          <div
            key={category.key}
            className="border rounded-lg p-6 bg-card shadow-sm"
          >
            <h2 className="text-2xl font-semibold mb-4">
              {t(`categories.${category.key}`)}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {category.items.map((key) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-start cursor-pointer">
                    {t(`items.${key}.q`, { brand })}
                  </AccordionTrigger>
                  {/* forceMount: Radix otherwise leaves a closed panel out
                      of the DOM, so the server HTML held every question and
                      no answer — nothing for a search engine to index, and
                      nothing to read before hydration. Force-mounted, Radix
                      no longer hides a closed panel itself, so the answer
                      hides when its panel's data-state is closed. */}
                  <AccordionContent
                    forceMount
                    className="[[data-state=closed]>&]:hidden"
                  >
                    <div className="text-muted-foreground">{answer(key)}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      {/* Contact support section */}
      <div className="mt-16 bg-muted rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-3">{t("contact.title")}</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          {t("contact.body")}
        </p>
        {/* asChild: a link inside a <button> is invalid HTML, and only the
            text — not the padded button around it — was clickable. */}
        <Button size="lg" asChild>
          <Link href="/contact">{t("contact.cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
