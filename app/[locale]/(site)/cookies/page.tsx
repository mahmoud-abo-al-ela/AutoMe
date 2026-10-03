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
  const t = await getTranslations({ locale, namespace: "legal.cookies" });

  return localizedPageMetadata("/cookies", locale as Locale, {
    title: t("title"),
    description: t("description"),
  });
}

export default async function CookiePolicyPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations("legal");
  const items = ["i1", "i2", "i3", "i4"] as const;

  return (
    <LegalDocument
      title={t("cookies.title")}
      updated={t("lastUpdated", { date: formatDate(LEGAL_LAST_UPDATED, locale as Locale) })}
    >
      <h2>{t("cookies.s1.heading")}</h2>
      <p>{t("cookies.s1.body")}</p>

      <h2>{t("cookies.s2.heading")}</h2>
      <p>{t("cookies.s2.body")}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{t(`cookies.s2.items.${item}`)}</li>
        ))}
      </ul>
    </LegalDocument>
  );
}
