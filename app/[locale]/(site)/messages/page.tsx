import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";
import { UserChannelList, ChatWindow } from "@/components/StreamChat";
import { getCurrentOrganization } from "@/lib/getOrganization";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chat.inbox.meta" });

  return { title: t("title"), description: t("description") };
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("chat.inbox");

  const { userId } = await auth();

  if (!userId) {
    redirect({ href: "/sign-in", locale: await getLocale() });
  }

  // Get current organization context (null on main domain, set on subdomain)
  const organization = await getCurrentOrganization();

  return (
    <div className="container mx-auto px-4 pb-6 pt-20 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {organization
            ? t("subtitleForOrg", { name: organization.name })
            : t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-0 h-[calc(100vh-220px)] md:h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card shadow-sm">
        {/* Channel List - scoped to current organization on subdomains */}
        <div className="border-e flex flex-col overflow-hidden bg-background">
          <UserChannelList organizationId={organization?.id} />
        </div>

        {/* Chat Window */}
        <div className="flex flex-col overflow-hidden bg-background">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
