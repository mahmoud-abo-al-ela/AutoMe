import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";
import { getDealershipBySlug } from "@/actions/dealerships";
import { DealershipDetailPresenter } from "./_components";
import { localizedPageMetadata } from "@/lib/utils/page-seo";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
    const { slug, locale } = await params;
    const t = await getTranslations({ locale, namespace: "dealerships.meta" });

    try {
        // `params` is a promise in Next 15. Reading `.slug` off it directly gave
        // undefined, so every dealership page fell into the catch below and
        // served the generic fallback title/description/OG tags.
        const dealership = await getDealershipBySlug(slug);

        if (!dealership.success || !dealership.data) {
            return {
                title: t("notFoundTitle"),
                description: t("notFoundDescription"),
            };
        }

        // The payload carries `city`/`region` at the top level; there is no
        // `location` object, so the two location keywords below were always
        // undefined and filtered out.
        const { name, description, city, region, logo, carCount } =
            dealership.data;

        // The tab title gets the brand from the root title.template; og/twitter
        // titles do not inherit it, so they spell the brand out themselves.
        const title = name;
        const socialTitle = name + " | AutoMe";
        const desc =
            description ||
            t("detailDescription", {
                name,
                count: carCount || 0,
                value: formatNumber(carCount || 0, locale as Locale),
            });

        const meta = await localizedPageMetadata(`/dealerships/${slug}`, locale as Locale, {
            title,
            description: desc,
        });

        return {
            ...meta,
            keywords: [name, t("keywords"), city, region].filter(Boolean).join(", "),
            openGraph: {
                ...meta.openGraph,
                title: socialTitle,
                description: desc,
                type: "website",
                images: [
                    {
                        url: logo || "/og-image.jpg",
                        width: 1200,
                        height: 630,
                        alt: `${name} logo`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: socialTitle,
                description: desc,
                images: [logo || "/og-image.jpg"],
            },
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: t("fallbackTitle"),
            description: t("fallbackDescription"),
        };
    }
}

const DealershipDetailPage = async ({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}) => {

    return <DealershipDetailPresenter />;
};

export default DealershipDetailPage;
