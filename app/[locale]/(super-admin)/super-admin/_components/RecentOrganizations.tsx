import { Link } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, ArrowRight, Car, Users } from "lucide-react";
import { Prisma, PlanType } from "@/lib/generated/prisma";

/** The organization rows page.tsx loads for this table, with their joins. */
export type RecentOrganization = Prisma.OrganizationGetPayload<{
  include: {
    subscription: { include: { plan: true } };
    _count: { select: { cars: true; memberships: true } };
  };
}>;

export default function RecentOrganizations({
  organizations,
}: {
  organizations: RecentOrganization[];
}) {
  const getPlanBadgeColor = (planType: PlanType | undefined) => {
    switch (planType) {
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "PRO":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "STARTER":
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Recent Organizations
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Latest organizations added to the platform
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/super-admin/organizations">
            View All
            <ArrowRight className="h-4 w-4 ms-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-center">Cars</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length > 0 ? (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {org.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getPlanBadgeColor(
                        org.subscription?.plan?.type
                      )}
                    >
                      {org.subscription?.plan?.name || "No Plan"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Car className="h-3 w-3 text-muted-foreground" />
                      <span>{org._count.cars}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{org._count.memberships}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.isActive ? "default" : "secondary"}>
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(org.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No organizations yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
