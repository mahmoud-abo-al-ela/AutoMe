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
        title: t("title"),
        description: t("description"),
        keywords: t("keywords"),
        openGraph: {
            title: t("title"),
            description: t("ogDescription"),
            type: "website",
        },
    };
}

export default function DealershipsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
