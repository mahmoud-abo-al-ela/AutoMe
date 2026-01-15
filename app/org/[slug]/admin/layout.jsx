import { checkUser } from "@/lib/checkUser";
import { notFound, redirect } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";
import ImpersonationBanner from "./_components/ImpersonationBanner";
import {
  getOrganizationBySlug,
  getUserMembership,
} from "@/lib/getOrganization";
import { getCurrentImpersonationSession } from "@/lib/services/impersonation/impersonation";
import { Toaster } from "sonner";

export default async function AdminLayout({ children, params }) {
  const { slug } = await params;
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get organization from path parameter
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    // No organization found - redirect to main site
    notFound();
  }

  // Check if user is impersonating
  const impersonationSession = await getCurrentImpersonationSession();
  const isImpersonating = !!impersonationSession;

  // Get user's membership in this organization
  const membership = await getUserMembership(user.id, organization.id);

  // Allow access if:
  // 1. User is an Admin (platform admin - can view any org)
  // 2. User is impersonating someone in this org
  // 3. User has any membership in this org (OWNER or MEMBER)
  const isAdmin = user.role === "ADMIN";
  const hasOrgAccess = !!membership;

  if (!isAdmin && !isImpersonating && !hasOrgAccess) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" richColors />
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
