import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatDate } from "@/lib/utils/datetime";
import type { Locale } from "@/i18n/routing";
import { LEGAL_LAST_UPDATED } from "../_lib/legal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });

  return { title: t("title"), description: t("description") };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const sections = ["s1", "s2", "s3"] as const;

  return (
    <div className="container mx-auto px-4 pt-28 pb-12 md:pt-32 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">{t("terms.title")}</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-500 mb-8">
          {t("lastUpdated", {
            date: formatDate(LEGAL_LAST_UPDATED, locale as Locale),
          })}
        </p>

        {sections.map((section) => (
          <section key={section}>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t(`terms.${section}.heading`)}
            </h2>
            <p>{t(`terms.${section}.body`)}</p>
          </section>
        ))}

        <p className="text-sm text-gray-500 mt-12 border-t pt-6">
          {t("governingLanguage")}
        </p>
      </div>
    </div>
  );
}
