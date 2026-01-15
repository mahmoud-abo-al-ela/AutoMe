import Link from "next/link";
import { Users, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const roleColors = {
  OWNER:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MEMBER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function OrgMembers({ memberships, orgId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({memberships.length})
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
                  <AvatarImage src={m.user.imageUrl} alt={m.user.name} />
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
                <Badge className={roleColors[m.role]}>{m.role}</Badge>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/super-admin/users/${m.user.id}`}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
