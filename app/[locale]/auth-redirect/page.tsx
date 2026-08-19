import { checkUser } from "@/lib/checkUser";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function AuthRedirectPage() {
    const user = await checkUser();
    // next-intl's redirect takes the locale explicitly — it has no ambient
    // request context to infer it from, and omitting it is a type error rather
    // than a silent drop into the default locale.
    const locale = await getLocale();

    if (!user) {
        redirect({ href: "/sign-in", locale });
    }

    // Super Admin - redirect to super admin dashboard
    if (user.role === "ADMIN") {
        redirect({ href: "/super-admin", locale });
    }

    // Org member/owner - redirect to their org admin
    if (user.memberships && user.memberships.length > 0) {
        const firstOrg = user.memberships[0].organization;
        redirect({ href: `/org/${firstOrg.slug}/dashboard`, locale });
    }


    // No organization - redirect to onboarding
    redirect({ href: "/", locale });
}
