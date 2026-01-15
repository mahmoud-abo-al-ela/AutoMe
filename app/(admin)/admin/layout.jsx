import { checkUser } from "@/lib/checkUser";
import { notFound, redirect } from "next/navigation";
import AdminSidebar from "@/app/(admin)/admin/_components/AdminSidebar";
import ImpersonationBanner from "@/app/(admin)/admin/_components/ImpersonationBanner";
import {
  getCurrentOrganization,
  getUserMembership,
} from "@/lib/getOrganization";
import { getCurrentImpersonationSession } from "@/lib/services/impersonation/impersonation";

export default async function AdminLayout({ children }) {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get current organization from subdomain
  const organization = await getCurrentOrganization();

  if (!organization) {
    // No organization found - redirect to main site or onboarding
    redirect("/");
  }

  // Check if user is impersonating
  const impersonationSession = await getCurrentImpersonationSession();
  const isImpersonating = !!impersonationSession;

  // Get user's membership in this organization
  const membership = await getUserMembership(user.id, organization.id);

  // Allow access if:
  // 1. User is a Super Admin (can view any org)
  // 2. User is impersonating someone in this org
  // 3. User has OWNER or ADMIN membership in this org
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const hasAdminAccess =
    membership && (membership.role === "OWNER" || membership.role === "ADMIN");

  if (!isSuperAdmin && !isImpersonating && !hasAdminAccess) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar organization={organization} />
      <main
        className="flex-1 transition-all duration-300 ease-in-out flex flex-col"
        style={{ marginLeft: "var(--sidebar-width, 0)" }}
      >
        {isImpersonating && impersonationSession && (
          <ImpersonationBanner
            targetUser={impersonationSession.targetUser}
            organization={organization}
          />
        )}
        <div className="md:hidden h-16" />
        <div className="p-4 md:p-6 animate-in fade-in duration-500 flex-1 min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
