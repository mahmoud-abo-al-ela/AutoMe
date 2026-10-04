"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { LogOut, Clock, Building2, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { endImpersonation } from "@/actions/super-admin";
import { EmptyState } from "@/components/common/EmptyState";
import { Shield } from "lucide-react";
import { Prisma } from "@/lib/generated/prisma";

/**
 * An impersonation session row as page.tsx selects it. Shared with
 * SessionHistory, which queries the same shape for ended sessions.
 */
export type ImpersonationSessionRow = Prisma.ImpersonationSessionGetPayload<{
  include: {
    superAdmin: { select: { id: true; name: true; email: true; imageUrl: true } };
    targetUser: { select: { id: true; name: true; email: true; imageUrl: true } };
    organization: { select: { id: true; name: true; slug: true } };
  };
}>;

export default function ActiveSessions({
  sessions,
}: {
  sessions: ImpersonationSessionRow[];
}) {
  const t = useTranslations("superAdmin.impersonation.active");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const { relativeToNow, number } = useFormatters();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [endingSession, setEndingSession] = useState<string | null>(null);

  // targetUserName is nullable because User.name is.
  const handleEndSession = async (
    sessionId: string,
    targetUserName: string | null
  ) => {
    setEndingSession(sessionId);
    try {
      const result = await endImpersonation(sessionId);
      if (result.success) {
        toast.success(t("ended"), {
          description: t("endedBody", {
            name: targetUserName ?? tCommon("unknown"),
          }),
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(t("endFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), {
        description: tCommon("errorBody"),
      });
    } finally {
      setEndingSession(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("title")}</span>
          <Badge variant={sessions.length > 0 ? "destructive" : "secondary"}>
            {t("badge", { value: number(sessions.length) })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <EmptyState variant="inline" icon={Shield} title={t("empty")} />
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2 rtl:space-x-reverse">
                    <Avatar className="border-2 border-background">
                      <AvatarImage
                        src={session.superAdmin.imageUrl ?? undefined}
                        alt={session.superAdmin.name ?? ""}
                      />
                      <AvatarFallback>
                        {session.superAdmin.name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="border-2 border-background">
                      <AvatarImage
                        src={session.targetUser.imageUrl ?? undefined}
                        alt={session.targetUser.name ?? ""}
                      />
                      <AvatarFallback>
                        {session.targetUser.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1.5">
                      {session.superAdmin.name}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />
                      {session.targetUser.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      {session.organization.name}
                      <span className="text-muted-foreground">•</span>
                      <Clock className="h-3 w-3" />
                      {t("started", {
                        time: relativeToNow(new Date(session.startedAt)),
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
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t("ending")}
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 me-2 rtl:rotate-180" />
                      {t("end")}
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
