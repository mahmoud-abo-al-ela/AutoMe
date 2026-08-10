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
 * Super Admin sidebar navigation configuration
 */
export const superAdminSidebarItems = [
  {
    name: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    path: "/super-admin",
  },
  {
    name: "organizations",
    label: "Organizations",
    icon: Building2,
    path: "/super-admin/organizations",
  },
  {
    name: "users",
    label: "All Users",
    icon: Users,
    path: "/super-admin/users",
  },
  {
    name: "plans",
    label: "Plans & Pricing",
    icon: CreditCard,
    path: "/super-admin/plans",
  },
  {
    name: "analytics",
    label: "Analytics",
    icon: BarChart3,
    path: "/super-admin/analytics",
  },
  {
    name: "audit-logs",
    label: "Audit Logs",
    icon: FileText,
    path: "/super-admin/audit-logs",
  },
  {
    name: "impersonation",
    label: "Impersonation",
    icon: UserCog,
    path: "/super-admin/impersonation",
  },
  {
    name: "settings",
    label: "Platform Settings",
    icon: Settings,
    path: "/super-admin/settings",
  },
];

export default superAdminSidebarItems;
