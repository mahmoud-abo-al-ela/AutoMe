import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "dealerships.meta" });

    return {
        // Keywords only. A plain-string `title` here carries no template, so
        // the listing and every dealership page beneath it lost the root
        // layout's "%s | AutoMe"; title, description and Open Graph are set
        // by each page instead.
        keywords: t("keywords"),
    };
}

export default function DealershipsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
