import { Building2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { tenantHost } from "@/lib/utils/tenant-host";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import type { SuperAdminUserDetail } from "./UserDetailsHeader";

export default function UserOrganizations({
  memberships,
}: {
  memberships: SuperAdminUserDetail["memberships"];
}) {
  const t = useTranslations("superAdmin.users.details");
  const tCommon = useTranslations("superAdmin.common");
  const tRoles = useTranslations("org.settings.team.roles");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t("organizations")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {memberships.length === 0 ? (
          <EmptyState variant="inline" icon={Building2} title={t("organizationsEmpty")} />
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => (
              <div
                key={m.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{m.organization.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <span dir="ltr">{tenantHost(m.organization.slug)}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{tRoles(m.role)}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {m.organization.subscription?.plan?.name || tCommon("noPlan")}
                  </Badge>
                  {/* Styles on the Link, not <Button asChild>: in a server
                      component Radix Slot 1.2.2 can receive the link as a
                      lazy element and render nothing. */}
                  <Link
                    href={`/super-admin/organizations/${m.organization.id}`}
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    <ExternalLink className="h-3 w-3 me-1" />
                    {tCommon("view")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
