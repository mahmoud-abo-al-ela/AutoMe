import { UserCog, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImpersonationHeader({ activeCount }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserCog className="h-8 w-8" />
          Impersonation
        </h1>
        <p className="text-muted-foreground">
          View organizations as their owners for support and debugging
        </p>
      </div>

      {activeCount > 0 && (
        <Alert variant="warning" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            There {activeCount === 1 ? "is" : "are"} {activeCount} active
            impersonation session{activeCount !== 1 ? "s" : ""}. All actions
            performed during impersonation are logged.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
