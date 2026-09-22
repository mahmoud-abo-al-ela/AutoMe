import { Building2, Clock, Users } from "lucide-react";
import React from "react";
import type { Metadata } from "next";
import SharedSettingCard, {
  type SettingsPageLink,
} from "./_components/SharedSettingCard";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your settings",
};

const SettingsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const settingsPages: SettingsPageLink[] = [
    {
      title: "Organization Profile",
      description: "Manage public dealership details and discovery location",
      icon: Building2,
      path: `/org/${slug}/settings/profile`,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Working Hours",
      description: "Configure business operating hours and availability",
      icon: Clock,
      path: `/org/${slug}/settings/working-hours`,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Team Members",
      description: "Manage your team members",
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
              Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your settings and preferences
            </p>
          </div>
        </div>
      </div>
      <SharedSettingCard settingsPages={settingsPages} />
    </div>
  );
};

export default SettingsPage;
