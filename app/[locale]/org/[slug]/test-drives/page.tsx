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
