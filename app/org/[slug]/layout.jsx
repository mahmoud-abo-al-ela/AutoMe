import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug } from "@/lib/getOrganization";
import BackToTop from "@/components/BackToTop";
import { Toaster } from "sonner";
import { Suspense } from "react";
import Loading from "@/components/Loading";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
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

export default async function OrganizationLayout({ children, params }) {
    const { slug } = await params;
    let organization = null;

    try {
        user = await checkUser();
        organization = await getOrganizationBySlug(slug);
    } catch (error) {
        console.error("Error in organization layout:", error);
    }

    if (!organization) {
        notFound();
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Suspense
                fallback={
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Loading />
                    </div>
                }
            >
                {children}
            </Suspense>
            <BackToTop />
            <Toaster position="top-right" richColors />
        </div>
    );
}
