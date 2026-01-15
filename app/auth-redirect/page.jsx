import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
    const user = await checkUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Super Admin - redirect to super admin dashboard
    if (user.role === "ADMIN") {
        redirect("/super-admin");
    }

    // Org member/owner - redirect to their org admin
    if (user.memberships && user.memberships.length > 0) {
        const firstOrg = user.memberships[0].organization;
        redirect(`/org/${firstOrg.slug}/admin`);
    }

    // No organization - redirect to onboarding
    redirect("/onboarding");
}
