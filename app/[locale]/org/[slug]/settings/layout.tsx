import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { OrgPageHeader } from "../_components/OrgPageHeader";
import { SettingsTabs } from "./_components/SettingsTabs";

/**
 * Settings, as three tabs (canvas: Settings round 1, "2 · Storefront"): what
 * buyers see, who works here, and the emails the dealership gets. Each tab is
 * its own address, so a link — the weekly email's, say — opens the right one.
 */
export default async function SettingsLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("org.settings");

  return (
    <div className="flex flex-col gap-5">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Link
            href={`/dealerships/${slug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
          >
            {t("openPage")}
            <ExternalLink aria-hidden className="size-4" />
          </Link>
        }
        className="mb-0 md:mb-0"
      />
      <SettingsTabs base={`/org/${slug}/settings`} />
      {children}
    </div>
  );
}
