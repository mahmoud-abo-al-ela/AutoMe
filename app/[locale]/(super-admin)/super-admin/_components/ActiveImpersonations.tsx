import { Link } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, ArrowRight, Clock, AlertCircle } from "lucide-react";
import {
  getActiveImpersonationCount,
  getImpersonationSessions,
} from "@/lib/services/impersonation";

export default async function ActiveImpersonations() {
  const activeCount = await getActiveImpersonationCount();
  const { sessions } = await getImpersonationSessions({
    filters: { activeOnly: true },
    pagination: { page: 1, limit: 5 },
  });

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            Active Impersonations
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Currently active admin impersonation sessions
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/super-admin/impersonation">
            View All
            <ArrowRight className="h-4 w-4 ms-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {activeCount > 0 ? (
          <div className="space-y-3">
            {/* Warning banner */}
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                {activeCount} active impersonation{" "}
                {activeCount === 1 ? "session" : "sessions"}
              </span>
            </div>

            {/* Active sessions list */}
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {session.superAdmin?.name || "Unknown Admin"}
                      </span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="text-sm">
                        {session.targetUser?.name || "Unknown User"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {session.targetOrganization?.name || "Unknown Org"}
                      </Badge>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.startedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <UserCog className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              No active impersonation sessions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
