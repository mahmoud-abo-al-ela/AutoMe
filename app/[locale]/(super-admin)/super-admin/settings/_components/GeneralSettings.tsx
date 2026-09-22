"use client";

import { useState } from "react";
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
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulated save
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Settings saved successfully");
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure basic platform settings and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={formData.platformName}
              onChange={(e) =>
                setFormData({ ...formData, platformName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
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
          <Label htmlFor="trialDays">Default Trial Period (days)</Label>
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
          <p className="text-xs text-muted-foreground">
            Number of days for new organization trials
          </p>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              Temporarily disable access for all users except super admins
            </p>
          </div>
          <Switch
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
            <AlertDescription>
              Maintenance mode is enabled. Regular users will not be able to
              access the platform.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 me-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
