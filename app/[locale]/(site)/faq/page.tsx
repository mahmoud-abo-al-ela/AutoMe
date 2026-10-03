import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Minus, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/brand";
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
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 xl:px-0">
      <PageHeader title={t("title")} subtitle={t("subtitle", { brand })} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        {/* Section index: a jump list on wide screens, where the page is
            long enough to need one. */}
        <nav aria-label={t("title")} className="hidden lg:block">
          <ul className="sticky top-[96px] flex flex-col gap-1 border-s border-border">
            {FAQ_CATEGORIES.map((category) => (
              <li key={category.key}>
                <a
                  href={`#faq-${category.key}`}
                  className="-ms-px block border-s-2 border-transparent py-1.5 ps-4 text-caption text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                >
                  {t(`categories.${category.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex max-w-3xl flex-col gap-12">
          {FAQ_CATEGORIES.map((category) => (
            <section key={category.key} id={`faq-${category.key}`} aria-labelledby={`faq-${category.key}-title`} className="scroll-mt-28">
              <h2 id={`faq-${category.key}-title`} className="mb-2 text-h2 font-extrabold">
                {t(`categories.${category.key}`)}
              </h2>
              <AccordionPrimitive.Root type="single" collapsible className="border-t border-border">
                {category.items.map((key) => (
                  <AccordionPrimitive.Item key={key} value={key} className="border-b border-border">
                    <AccordionPrimitive.Header>
                      <AccordionPrimitive.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-start outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                        <span className="text-[1.0625rem] font-semibold">{t(`items.${key}.q`, { brand })}</span>
                        <Plus aria-hidden className="size-5 shrink-0 group-data-[state=open]:hidden" />
                        <Minus aria-hidden className="size-5 shrink-0 group-data-[state=closed]:hidden" />
                      </AccordionPrimitive.Trigger>
                    </AccordionPrimitive.Header>
                    {/* forceMount: Radix otherwise leaves a closed panel out
                        of the DOM, so the server HTML held every question and
                        no answer — nothing for a search engine to index, and
                        nothing to read before hydration. Force-mounted, Radix
                        no longer hides a closed panel itself, so it is hidden
                        by its own data-state. */}
                    <AccordionPrimitive.Content forceMount className="data-[state=closed]:hidden">
                      <div className="pb-5 text-body text-muted-foreground">{answer(key)}</div>
                    </AccordionPrimitive.Content>
                  </AccordionPrimitive.Item>
                ))}
              </AccordionPrimitive.Root>
            </section>
          ))}

          <section aria-labelledby="faq-contact-title" className="flex flex-col items-start gap-4 rounded-sheet border border-border bg-card p-6 sm:p-8">
            <h2 id="faq-contact-title" className="text-h2 font-extrabold">
              {t("contact.title")}
            </h2>
            <p className="max-w-lg text-body text-muted-foreground">{t("contact.body")}</p>
            {/* The link styled as a button — a link inside a <button> is invalid
                HTML. Not <Button asChild>: in a Server Component the i18n Link
                suspends on the locale and Radix Slot renders nothing for it. */}
            <Link href="/contact" className={buttonVariants({ variant: "marker", size: "xl" })}>
              {t("contact.cta")}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
