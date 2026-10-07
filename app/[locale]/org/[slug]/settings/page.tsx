import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getDealershipInfo, getDealershipTerms, getOrganizationProfile } from "@/actions/settings";
import { canEditSettings } from "./_lib/can-edit";
import { StorefrontEditor } from "./_components/storefront/StorefrontEditor";
import { hoursFromStored, profileFromStored, termsFromStored } from "./_components/storefront/storefront-state";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.settings.meta" });
  return { title: t("title"), description: t("description") };
}

/** Settings' first tab: the storefront — profile, opening hours and terms — beside its preview. */
export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("org.settings");
  const [profile, hours, terms, canEdit] = await Promise.all([
    getOrganizationProfile(),
    getDealershipInfo(),
    getDealershipTerms(),
    canEditSettings(slug),
  ]);

  if (!profile.success || !hours.success || !terms.success) {
    return (
      <p role="alert" className="rounded-[20px] border border-border bg-card p-6 text-body">
        {t("storefront.loadFailed")}
      </p>
    );
  }

  return (
    <StorefrontEditor
      initial={{
        profile: profileFromStored(profile.data.profile),
        hours: hoursFromStored(hours.data.workingHours),
        terms: termsFromStored(terms.data),
      }}
      logo={profile.data.profile?.logo ?? null}
      canEdit={canEdit}
    />
  );
}
