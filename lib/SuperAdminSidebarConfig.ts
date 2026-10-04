import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  UserCog,
  Settings,
} from "lucide-react";

/**
 * Super Admin sidebar navigation configuration.
 *
 * `labelKey` resolves against `superAdmin.nav`: a key rather than a label,
 * because the sidebars render in whichever locale the reader chose.
 */
export const superAdminSidebarItems = [
  {
    name: "overview",
    labelKey: "overview",
    icon: LayoutDashboard,
    path: "/super-admin",
  },
  {
    name: "organizations",
    labelKey: "organizations",
    icon: Building2,
    path: "/super-admin/organizations",
  },
  {
    name: "users",
    labelKey: "users",
    icon: Users,
    path: "/super-admin/users",
  },
  {
    name: "plans",
    labelKey: "plans",
    icon: CreditCard,
    path: "/super-admin/plans",
  },
  {
    name: "analytics",
    labelKey: "analytics",
    icon: BarChart3,
    path: "/super-admin/analytics",
  },
  {
    name: "audit-logs",
    labelKey: "auditLogs",
    icon: FileText,
    path: "/super-admin/audit-logs",
  },
  {
    name: "impersonation",
    labelKey: "impersonation",
    icon: UserCog,
    path: "/super-admin/impersonation",
  },
  {
    name: "settings",
    labelKey: "settings",
    icon: Settings,
    path: "/super-admin/settings",
  },
] as const;

export default superAdminSidebarItems;
