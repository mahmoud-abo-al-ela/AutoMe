import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cars.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function CarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
