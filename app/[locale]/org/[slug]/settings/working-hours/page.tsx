import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default async function OldStorefrontSettingPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  redirect({ href: `/org/${slug}/settings`, locale });
}
