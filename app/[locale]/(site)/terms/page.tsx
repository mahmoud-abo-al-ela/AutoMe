import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils/datetime";
import type { Locale } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/utils/page-seo";
import { LEGAL_LAST_UPDATED } from "../_lib/legal";
import { LegalDocument } from "../_components/LegalDocument";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return localizedPageMetadata("/terms", locale as Locale, {
    title: t("title"),
    description: t("description"),
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations("legal");
  const sections = ["s1", "s2", "s3"] as const;

  return (
    <LegalDocument
      title={t("terms.title")}
      updated={t("lastUpdated", { date: formatDate(LEGAL_LAST_UPDATED, locale as Locale) })}
    >
      {sections.map((section) => (
        <section key={section} className="flex flex-col gap-4">
          <h2>{t(`terms.${section}.heading`)}</h2>
          <p>{t(`terms.${section}.body`)}</p>
        </section>
      ))}
    </LegalDocument>
  );
}
