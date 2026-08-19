import { Building2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import type { SuperAdminUserDetail } from "./UserDetailsHeader";

export default function UserOrganizations({
  memberships,
}: {
  memberships: SuperAdminUserDetail["memberships"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organizations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {memberships.length === 0 ? (
          <EmptyState variant="inline" icon={Building2} title="Not a member of any organization" />
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
                      {m.organization.slug}.localhost
                    </div>
                  </div>
                  <Badge variant="outline">{m.role}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {m.organization.subscription?.plan?.name || "No Plan"}
                  </Badge>
                  <Button size="sm" variant="ghost" asChild>
                    <Link
                      href={`/super-admin/organizations/${m.organization.id}`}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
