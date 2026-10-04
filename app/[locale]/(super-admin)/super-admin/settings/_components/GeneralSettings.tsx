"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

/**
 * Platform-wide general settings. page.tsx currently returns these as
 * hardcoded defaults — there is no settings table behind them yet.
 */
export type GeneralSettingsValues = {
  platformName: string;
  supportEmail: string;
  /** Platform-level default, distinct from Plan.trialDays. */
  defaultTrialDays: number;
  maintenanceMode: boolean;
};

export default function GeneralSettings({
  settings,
}: {
  settings: GeneralSettingsValues;
}) {
  const t = useTranslations("superAdmin.settings.general");
  const tCommon = useTranslations("superAdmin.common");
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulated save
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(t("saved"));
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="platformName">{t("platformName")}</Label>
            <Input
              id="platformName"
              value={formData.platformName}
              onChange={(e) =>
                setFormData({ ...formData, platformName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={(e) =>
                setFormData({ ...formData, supportEmail: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trialDays">{t("trialDays")}</Label>
          <Input
            id="trialDays"
            type="number"
            className="w-32"
            value={formData.defaultTrialDays}
            onChange={(e) =>
              setFormData({
                ...formData,
                defaultTrialDays: parseInt(e.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">{t("trialDaysHelp")}</p>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="maintenanceMode">{t("maintenance")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("maintenanceHelp")}
            </p>
          </div>
          <Switch
            id="maintenanceMode"
            checked={formData.maintenanceMode}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, maintenanceMode: checked })
            }
          />
        </div>

        {formData.maintenanceMode && (
          <Alert
            // Alert defines only default and destructive; the warning look
            // comes entirely from these classes.
            className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{t("maintenanceOn")}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 me-2" />
            {loading ? tCommon("saving") : tCommon("saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
