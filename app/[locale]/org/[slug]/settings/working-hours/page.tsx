import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * The old address of one storefront setting. The profile, opening hours and
 * terms are now edited together on Settings' first tab; kept so a bookmark or
 * an old link still lands there.
 */
export default async function OldStorefrontSettingPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  redirect({ href: `/org/${slug}/settings`, locale });
}
