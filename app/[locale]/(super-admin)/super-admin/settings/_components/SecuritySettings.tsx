"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, Shield, Clock, Lock } from "lucide-react";
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
import { toast } from "sonner";

/** Platform-wide security settings; hardcoded defaults today. */
export type SecuritySettingsValues = {
  maxLoginAttempts: number;
  /** Hours. */
  sessionTimeout: number;
  requireMFA: boolean;
  /** Days. */
  auditLogRetention: number;
};

export default function SecuritySettings({
  settings,
}: {
  settings: SecuritySettingsValues;
}) {
  const t = useTranslations("superAdmin.settings.security");
  const tCommon = useTranslations("superAdmin.common");
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(t("saved"));
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">{t("maxLoginAttempts")}</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              value={formData.maxLoginAttempts}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxLoginAttempts: parseInt(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              {t("maxLoginAttemptsHelp")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">{t("sessionTimeout")}</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={formData.sessionTimeout}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sessionTimeout: parseInt(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              {t("sessionTimeoutHelp")}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="auditRetention">{t("retention")}</Label>
          <Input
            id="auditRetention"
            type="number"
            className="w-32"
            value={formData.auditLogRetention}
            onChange={(e) =>
              setFormData({
                ...formData,
                auditLogRetention: parseInt(e.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">{t("retentionHelp")}</p>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="requireMFA" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t("mfa")}
            </Label>
            <p className="text-sm text-muted-foreground">{t("mfaHelp")}</p>
          </div>
          <Switch
            id="requireMFA"
            checked={formData.requireMFA}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, requireMFA: checked })
            }
          />
        </div>

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
