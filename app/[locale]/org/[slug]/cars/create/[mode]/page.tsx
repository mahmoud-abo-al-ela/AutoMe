import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * The old "/create/manual" and "/create/ai" addresses. Both now lead to the
 * one add-a-car page, where the photos step offers to read the details.
 * Kept so a bookmark or an old link still lands somewhere useful.
 */
export default async function CreateCarByModePage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  redirect({ href: `/org/${slug}/cars/create`, locale });
}
