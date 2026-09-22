import { redirect } from "@/i18n/navigation";

export default async function OrganizationHomePage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    redirect({ href: `/org/${slug}/dashboard`, locale });
}

