"use client";

import { useState } from "react";
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

export default function EmailSettings({ settings }) {
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Email settings saved");
    setLoading(false);
  };

  const handleTestEmail = async () => {
    setTestLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    toast.success("Test email sent successfully");
    setTestLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Settings
        </CardTitle>
        <CardDescription>
          Configure email sending and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              value={formData.fromName}
              onChange={(e) =>
                setFormData({ ...formData, fromName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromEmail">From Email</Label>
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
          <h4 className="font-medium">Email Notifications</h4>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Welcome Email</Label>
              <p className="text-sm text-muted-foreground">
                Send welcome email to new organization owners
              </p>
            </div>
            <Switch
              checked={formData.welcomeEmailEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, welcomeEmailEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Test Drive Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send reminder emails before scheduled test drives
              </p>
            </div>
            <Switch
              checked={formData.testDriveReminderEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, testDriveReminderEnabled: checked })
              }
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleTestEmail} disabled={testLoading}>
            <Send className="h-4 w-4 mr-2" />
            {testLoading ? "Sending..." : "Send Test Email"}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
