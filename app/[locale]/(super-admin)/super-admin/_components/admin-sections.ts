/**
 * The super-admin sections, in the order the top bar lists them. `key` is the
 * label under `superAdmin.nav`; the messages test checks each one has a label.
 */
export const ADMIN_SECTIONS = [
  { key: "overview", path: "" },
  { key: "organizations", path: "/organizations" },
  { key: "users", path: "/users" },
  { key: "plans", path: "/plans" },
  { key: "impersonation", path: "/impersonation" },
  { key: "auditLogs", path: "/audit-logs" },
  { key: "analytics", path: "/analytics" },
] as const;
