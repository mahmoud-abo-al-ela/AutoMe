import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";
import { UserChannelList, ChatWindow } from "@/components/StreamChat";
import { getCurrentOrganization } from "@/lib/getOrganization";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | AutoMe",
  description: "Chat with dealerships about cars you're interested in",
};

export default async function MessagesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect({ href: "/sign-in", locale: await getLocale() });
  }

  // Get current organization context (null on main domain, set on subdomain)
  const organization = await getCurrentOrganization();

  return (
    <div className="container mx-auto px-4 pb-6 pt-20 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Messages</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {organization
            ? `Chat with ${organization.name} about cars you're interested in`
            : "Chat with dealerships about cars you're interested in"}
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
