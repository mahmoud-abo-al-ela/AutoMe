import { getTranslations } from "next-intl/server";
import { getEmailPreferences } from "@/actions/settings";
import { canEditSettings } from "../_lib/can-edit";
import { EmailSettings } from "./_components/EmailSettings";

/**
 * Settings' Emails tab: the weekly summary, and the language the dealership's
 * emails are written in. The summary's own emails link here.
 */
export default async function WeeklySummarySettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("org.settings.weeklySummary");
  const [preferences, canEdit] = await Promise.all([getEmailPreferences(), canEditSettings(slug)]);

  if (!preferences.success || !preferences.data) {
    return (
      <p role="alert" className="rounded-[20px] border border-border bg-card p-6 text-body">
        {t("loadFailed")}
      </p>
    );
  }

  return (
    <EmailSettings
      initial={{
        weeklyDigestEnabled: preferences.data.weeklyDigestEnabled,
        emailLocale: preferences.data.emailLocale === "en" ? "en" : "ar",
      }}
      canEdit={canEdit}
    />
  );
}
