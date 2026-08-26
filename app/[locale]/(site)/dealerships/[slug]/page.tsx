import type { Metadata } from "next";
import { getDealershipBySlug } from "@/actions/dealerships";
import { DealershipDetailPresenter } from "./_components";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    try {
        // `params` is a promise in Next 15. Reading `.slug` off it directly gave
        // undefined, so every dealership page fell into the catch below and
        // served the generic fallback title/description/OG tags.
        const { slug } = await params;
        const dealership = await getDealershipBySlug(slug);

        if (!dealership.success || !dealership.data) {
            return {
                title: "Dealership Not Found",
                description: "The requested dealership could not be found.",
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
        const desc = description || `View ${name}'s inventory, reviews, and contact information. ${carCount || 0} cars available.`;

        return {
            title,
            description: desc,
            keywords: [name, "dealership", "car dealership", "automotive", "cars for sale", city, region].filter(Boolean).join(", "),
            openGraph: {
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
                siteName: "AutoMe",
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
            title: "Dealership",
            description: "View dealership information on AutoMe",
        };
    }
}

const DealershipDetailPage = () => {
    return <DealershipDetailPresenter />;
};

export default DealershipDetailPage;
