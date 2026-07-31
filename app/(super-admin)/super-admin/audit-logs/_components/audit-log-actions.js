// Action categorization + display config for audit log rows.
import { Plus, Pencil, Trash2, Eye, LogIn, LogOut } from "lucide-react";

// Map a detailed action name to a broad category.
export const getActionCategory = (action) => {
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

export const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  VIEW: Eye,
  LOGIN: LogIn,
  LOGOUT: LogOut,
};

export const actionColors = {
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
