import { Car, Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prisma } from "@/lib/generated/prisma";

/** The leaderboard rows page.tsx loads, with the counts this card ranks on. */
export type TopOrganization = Prisma.OrganizationGetPayload<{
  include: {
    _count: { select: { cars: true; testDrives: true } };
    subscription: { include: { plan: true } };
  };
}>;

export default function TopOrganizations({
  title,
  organizations,
  metric,
}: {
  title: string;
  organizations: TopOrganization[];
  metric: "cars" | "testDrives";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {metric === "cars" ? (
            <Car className="h-5 w-5" />
          ) : (
            <Calendar className="h-5 w-5" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {organizations.map((org, index) => (
            <div
              key={org.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">
                  #{index + 1}
                </span>
                <div>
                  <div className="font-medium">{org.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {org.slug}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {metric === "cars" ? org._count.cars : org._count.testDrives}
                </div>
                <Badge variant="outline" className="text-xs">
                  {org.subscription?.plan?.name || "No Plan"}
                </Badge>
              </div>
            </div>
          ))}
          {organizations.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
