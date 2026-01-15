import { db } from "@/lib/prisma";
import SettingsHeader from "./_components/SettingsHeader";
import GeneralSettings from "./_components/GeneralSettings";
import SecuritySettings from "./_components/SecuritySettings";
import EmailSettings from "./_components/EmailSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getPlatformSettings() {
  // In a real app, these would be stored in a settings table
  // For now, we'll use hardcoded defaults
  return {
    general: {
      platformName: "AutoMe",
      supportEmail: "support@autome.com",
      defaultTrialDays: 14,
      maintenanceMode: false,
    },
    security: {
      maxLoginAttempts: 5,
      sessionTimeout: 24, // hours
      requireMFA: false,
      auditLogRetention: 90, // days
    },
    email: {
      fromName: "AutoMe",
      fromEmail: "noreply@autome.com",
      welcomeEmailEnabled: true,
      testDriveReminderEnabled: true,
    },
  };
}

export default async function SettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <SettingsHeader />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings settings={settings.general} />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings settings={settings.security} />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettings settings={settings.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
