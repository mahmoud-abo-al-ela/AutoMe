"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { LogOut, Clock, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { endImpersonation } from "@/actions/super-admin";
import { EmptyState } from "@/components/common/EmptyState";
import { Shield } from "lucide-react";

export default function ActiveSessions({ sessions }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [endingSession, setEndingSession] = useState(null);

  const handleEndSession = async (sessionId, targetUserName) => {
    setEndingSession(sessionId);
    try {
      const result = await endImpersonation(sessionId);
      if (result.success) {
        toast.success("Impersonation session ended", {
          description: `Session as ${targetUserName} has been terminated.`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to end session", {
          description: result.error?.message || "An error occurred.",
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setEndingSession(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Sessions</span>
          <Badge variant={sessions.length > 0 ? "destructive" : "secondary"}>
            {sessions.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <EmptyState variant="inline" icon={Shield} title="No active impersonation sessions" />
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <Avatar className="border-2 border-background">
                      <AvatarImage
                        src={session.superAdmin.imageUrl}
                        alt={session.superAdmin.name}
                      />
                      <AvatarFallback>
                        {session.superAdmin.name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="border-2 border-background">
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
                    <div className="font-medium">
                      {session.superAdmin.name}{" "}
                      <span className="text-muted-foreground">→</span>{" "}
                      {session.targetUser.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      {session.organization.name}
                      <span className="text-muted-foreground">•</span>
                      <Clock className="h-3 w-3" />
                      Started{" "}
                      {formatDistanceToNow(new Date(session.startedAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    handleEndSession(session.id, session.targetUser.name)
                  }
                  disabled={endingSession === session.id || isPending}
                >
                  {endingSession === session.id ||
                  (isPending && endingSession === session.id) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ending...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      End Session
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
