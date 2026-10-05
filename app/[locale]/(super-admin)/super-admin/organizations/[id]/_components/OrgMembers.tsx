import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";
import { Users, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MemberRole } from "@/lib/generated/prisma";
import type { OrganizationDetail } from "./OrgDetailsHeader";

const roleColors: Record<MemberRole, string> = {
  OWNER:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  MEMBER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function OrgMembers({
  memberships,
  orgId,
}: {
  memberships: OrganizationDetail["memberships"];
  orgId: string;
}) {
  const t = useTranslations("superAdmin.organizations.details");
  const tRoles = useTranslations("org.settings.team.roles");
  const tCommon = useTranslations("superAdmin.common");
  const locale = useLocale() as Locale;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("members", { value: formatNumber(memberships.length, locale) })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {memberships.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={m.user.imageUrl ?? undefined}
                    alt={m.user.name ?? ""}
                  />
                  <AvatarFallback>
                    {m.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{m.user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {m.user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={roleColors[m.role]}>{tRoles(m.role)}</Badge>
                {/* Styles on the Link, not <Button asChild>: in a server
                    component Radix Slot 1.2.2 can receive the link as a lazy
                    element and render nothing. */}
                <Link
                  href={`/super-admin/users/${m.user.id}`}
                  aria-label={tCommon("viewDetails")}
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
