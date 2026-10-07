import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { cairoNow } from "@/lib/utils/datetime";
import { scheduleDaySchema } from "@/lib/validations/schemas";
import { TestDrivesView } from "./_components/TestDrivesView";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.testDrives.meta" });
  return { title: t("title") };
}

/**
 * The Test drives calendar. The chosen day is in the address (?date=2026-10-07)
 * so a refresh, a bookmark or a link from the overview opens that day; without
 * one — or with one that is not a date — it opens on today, in Cairo.
 */
export default async function TestDrivesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const requested = scheduleDaySchema.safeParse({ date: (await searchParams).date });
  const initialDate = requested.success ? requested.data.date : cairoNow().date;

  return <TestDrivesView key={initialDate} initialDate={initialDate} base={`/org/${slug}`} />;
}
