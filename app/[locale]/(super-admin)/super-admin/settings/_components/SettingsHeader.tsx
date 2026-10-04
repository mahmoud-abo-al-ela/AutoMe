import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SettingsHeader() {
  const t = useTranslations("superAdmin.settings");

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Settings className="h-8 w-8" />
        {t("title")}
      </h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
    </div>
  );
}
