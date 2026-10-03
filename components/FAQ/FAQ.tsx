"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Home FAQ (Figma: Accordion). Radix Accordion, so each question is a real
 * button with aria-expanded/aria-controls — the hand-rolled version it
 * replaces had neither. Hairline rows and +/−, not floating cards.
 */
const FAQ = ({ brandName = "AutoMe" }: { brandName?: string }) => {
  const t = useTranslations("home.faq");
  const faqs = ([1, 2, 3, 4, 5, 6] as const).map((n) => ({
    id: `q${n}`,
    question: t(`q${n}`, { brand: brandName }),
    answer: t(`a${n}`, { brand: brandName }),
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
      <div className="flex flex-col gap-3">
        <h2 className="text-h1 font-extrabold">
          {t("title")} {t("titleAccent")}
        </h2>
        <p className="text-body text-muted-foreground">
          {t("subtitle", { brand: brandName })}{" "}
          {/* Locale-aware Link, not a raw <a>: a bare href drops the locale
              prefix, so an Arabic reader clicking this was redirected into the
              English tree. */}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            {t("contactUs")}
          </Link>
        </p>
      </div>

      <AccordionPrimitive.Root type="single" collapsible defaultValue="q1" className="border-t border-border">
        {faqs.map((faq) => (
          <AccordionPrimitive.Item key={faq.id} value={faq.id} className="border-b border-border">
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-start outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span className="text-[1.0625rem] font-semibold">{faq.question}</span>
                <Plus aria-hidden className="size-5 shrink-0 group-data-[state=open]:hidden" />
                <Minus aria-hidden className="size-5 shrink-0 group-data-[state=closed]:hidden" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
              <p className="pb-5 text-body text-muted-foreground">{faq.answer}</p>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
};

export default FAQ;
