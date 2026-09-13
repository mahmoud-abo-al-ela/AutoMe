import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils/datetime";
import type { Locale } from "@/i18n/routing";
import { LEGAL_LAST_UPDATED } from "../_lib/legal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return { title: t("title"), description: t("description") };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations("legal");
  const items = ["i1", "i2", "i3", "i4"] as const;

  return (
    <div className="container mx-auto px-4 pt-28 pb-12 md:pt-32 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">{t("privacy.title")}</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-500 mb-8">
          {t("lastUpdated", {
            date: formatDate(LEGAL_LAST_UPDATED, locale as Locale),
          })}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          {t("privacy.s1.heading")}
        </h2>
        <p>{t("privacy.s1.body")}</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          {t("privacy.s2.heading")}
        </h2>
        <p>{t("privacy.s2.body")}</p>
        <ul className="list-disc ps-6 space-y-2">
          {items.map((item) => (
            <li key={item}>{t(`privacy.s2.items.${item}`)}</li>
          ))}
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          {t("privacy.s3.heading")}
        </h2>
        <p>{t("privacy.s3.body")}</p>

        <p className="text-sm text-gray-500 mt-12 border-t pt-6">
          {t("governingLanguage")}
        </p>
      </div>
    </div>
  );
}
