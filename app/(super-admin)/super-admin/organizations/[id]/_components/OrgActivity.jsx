import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  LogIn,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper to get action category from detailed action name
const getActionCategory = (action) => {
  if (action.includes("CREATED") || action.includes("INVITED")) return "CREATE";
  if (
    action.includes("UPDATED") ||
    action.includes("CHANGED") ||
    action.includes("TOGGLED") ||
    action.includes("UPGRADED") ||
    action.includes("DOWNGRADED") ||
    action.includes("RENEWED") ||
    action.includes("CONFIRMED") ||
    action.includes("COMPLETED") ||
    action.includes("ACTIVATED") ||
    action.includes("ACCEPTED")
  )
    return "UPDATE";
  if (
    action.includes("DELETED") ||
    action.includes("REMOVED") ||
    action.includes("CANCELED") ||
    action.includes("SUSPENDED")
  )
    return "DELETE";
  if (action.includes("STARTED") || action.includes("SENT")) return "LOGIN";
  if (action.includes("ENDED")) return "LOGOUT";
  return "VIEW";
};

const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  VIEW: Eye,
  LOGIN: LogIn,
  LOGOUT: LogOut,
};

const actionColors = {
  CREATE:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  VIEW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  LOGIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  LOGOUT:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function OrgActivity({ activity }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No activity recorded
          </p>
        ) : (
          <div className="space-y-3">
            {activity.map((log) => {
              const actionCategory = getActionCategory(log.action);
              const ActionIcon = actionIcons[actionCategory] || Eye;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={log.user?.imageUrl}
                      alt={log.user?.name}
                    />
                    <AvatarFallback>
                      {log.user?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {log.user?.name || "Unknown"}
                      </span>
                      <Badge
                        className={`flex items-center gap-1 text-xs ${
                          actionColors[actionCategory] || actionColors.VIEW
                        }`}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.entityType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
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
