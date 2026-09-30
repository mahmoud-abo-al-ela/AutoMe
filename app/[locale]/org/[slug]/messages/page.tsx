import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { auth } from "@clerk/nextjs/server";
import { getOrganization } from "@/lib/getOrganization";
import { OrganizationChannelList, ChatInbox } from "@/components/StreamChat";

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

      <ChatInbox list={<OrganizationChannelList organizationSlug={slug} />} />
    </div>
  );
}
