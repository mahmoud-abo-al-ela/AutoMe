"use client";

import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { Clock, Building2, CheckCircle, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";

export default function SessionHistory({ sessions }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Session History</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <EmptyState variant="inline" icon={History} title="No impersonation history" />
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const duration = differenceInMinutes(
                new Date(session.endedAt),
                new Date(session.startedAt)
              );

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage
                          src={session.superAdmin.imageUrl}
                          alt={session.superAdmin.name}
                        />
                        <AvatarFallback>
                          {session.superAdmin.name?.charAt(0) || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage
                          src={session.targetUser.imageUrl}
                          alt={session.targetUser.name}
                        />
                        <AvatarFallback>
                          {session.targetUser.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {session.superAdmin.name} → {session.targetUser.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {session.organization.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {duration} min
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(session.endedAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
