import { Building2, Clock, Users } from "lucide-react";
import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import SharedSettingCard, {
  type SettingsPageLink,
} from "./_components/SharedSettingCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.settings.meta" });

  return { title: t("title"), description: t("description") };
}

const SettingsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const t = await getTranslations("org.settings");

  const settingsPages: SettingsPageLink[] = [
    {
      key: "profile",
      title: t("cards.profile.title"),
      description: t("cards.profile.description"),
      icon: Building2,
      path: `/org/${slug}/settings/profile`,
      color: "bg-purple-50 text-purple-600",
    },
    {
      key: "workingHours",
      title: t("cards.workingHours.title"),
      description: t("cards.workingHours.description"),
      icon: Clock,
      path: `/org/${slug}/settings/working-hours`,
      color: "bg-blue-50 text-blue-600",
    },
    {
      key: "team",
      title: t("cards.team.title"),
      description: t("cards.team.description"),
      icon: Users,
      path: `/org/${slug}/settings/team`,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t("title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>
      <SharedSettingCard settingsPages={settingsPages} cta={t("configure")} />
    </div>
  );
};

export default SettingsPage;
