import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug, getUserMembership } from "@/lib/getOrganization";
import { getCurrentImpersonationSession } from "@/lib/services/impersonation/impersonation";
import BackToTop from "@/components/BackToTop";
import { Toaster } from "sonner";
import { Suspense } from "react";
import Loading from "@/components/Loading";
import { notFound, redirect } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";
import ImpersonationBanner from "./_components/ImpersonationBanner";

type OrgParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: OrgParams) {
    const { slug } = await params;
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
        return {
            title: "Organization Not Found",
        };
    }

    return {
        title: `${organization.name} | AutoMe`,
        description: `Browse cars from ${organization.name}`,
    };
}

export default async function OrganizationLayout({
    children,
    params,
}: OrgParams & { children: React.ReactNode }) {
    const { slug } = await params;
    const user = await checkUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Get organization from path parameter
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
        notFound();
    }

    // Check if user is impersonating
    const impersonationSession = await getCurrentImpersonationSession();
    const isImpersonating = !!impersonationSession;

    // Get user's membership in this organization
    const membership = await getUserMembership(user.id, organization.id);
    const isAdmin = user.role === "ADMIN";
    const hasOrgAccess = !!membership;

    if (!isAdmin && !isImpersonating && !hasOrgAccess) {
        notFound();
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Toaster position="top-right" richColors />
            <AdminSidebar organization={organization} userRole={membership?.role} />
            <main
                className="flex-1 transition-all duration-300 ease-in-out flex flex-col min-w-0"
                style={{ paddingLeft: "var(--sidebar-width, 0)" }}
            >
                {isImpersonating && impersonationSession && (
                    <ImpersonationBanner
                        session={impersonationSession}
                        organization={organization}
                    />
                )}
                <div className="md:hidden h-16" />
                <div className="p-4 md:p-6 animate-in fade-in duration-500 flex-1 min-h-0">
                    <Suspense
                        fallback={
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                                <Loading />
                            </div>
                        }
                    >
                        {children}
                    </Suspense>
                </div>
            </main>
            <BackToTop />
        </div>
    );
}

