import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { auth } from "@clerk/nextjs/server";
import { getOrganization } from "@/lib/getOrganization";
import { OrganizationChannelList, ChatWindow } from "@/components/StreamChat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chat.orgInbox.meta" });

  return { title: t("title"), description: t("description") };
}

export default async function OrganizationMessagesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("chat.orgInbox");

  if (!userId) {
    redirect({ href: "/sign-in", locale });
  }

  const { organization, membership } = await getOrganization(slug);

  if (!organization || !membership) {
    redirect({ href: "/", locale });
  }

  return (
    <div className="container mx-auto px-4 pb-6 pt-6 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-0 h-[calc(100vh-220px)] md:h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card shadow-sm">
        {/* Channel List */}
        <div className="border-e flex flex-col overflow-hidden bg-background">
          <OrganizationChannelList organizationSlug={slug} />
        </div>

        {/* Chat Window */}
        <div className="flex flex-col overflow-hidden bg-background">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
