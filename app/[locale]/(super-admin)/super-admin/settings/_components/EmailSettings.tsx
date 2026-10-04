"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, Mail, Send } from "lucide-react";
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

/** Platform-wide transactional email settings; hardcoded defaults today. */
export type EmailSettingsValues = {
  fromName: string;
  fromEmail: string;
  welcomeEmailEnabled: boolean;
  testDriveReminderEnabled: boolean;
};

export default function EmailSettings({
  settings,
}: {
  settings: EmailSettingsValues;
}) {
  const t = useTranslations("superAdmin.settings.email");
  const tCommon = useTranslations("superAdmin.common");
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(t("saved"));
    setLoading(false);
  };

  const handleTestEmail = async () => {
    setTestLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    toast.success(t("testSent"));
    setTestLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromName">{t("fromName")}</Label>
            <Input
              id="fromName"
              value={formData.fromName}
              onChange={(e) =>
                setFormData({ ...formData, fromName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromEmail">{t("fromEmail")}</Label>
            <Input
              id="fromEmail"
              type="email"
              value={formData.fromEmail}
              onChange={(e) =>
                setFormData({ ...formData, fromEmail: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">{t("notifications")}</h4>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="welcomeEmail">{t("welcome")}</Label>
              <p className="text-sm text-muted-foreground">{t("welcomeHelp")}</p>
            </div>
            <Switch
              id="welcomeEmail"
              checked={formData.welcomeEmailEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, welcomeEmailEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="testDriveReminders">{t("reminders")}</Label>
              <p className="text-sm text-muted-foreground">{t("remindersHelp")}</p>
            </div>
            <Switch
              id="testDriveReminders"
              checked={formData.testDriveReminderEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, testDriveReminderEnabled: checked })
              }
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleTestEmail}
            disabled={testLoading}
          >
            <Send className="h-4 w-4 me-2" />
            {testLoading ? t("sending") : t("sendTest")}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 me-2" />
            {loading ? tCommon("saving") : tCommon("saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
