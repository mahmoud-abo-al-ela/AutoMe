import { getDealershipBySlug } from "@/actions/dealerships";
import { DealershipDetailPresenter } from "./_components";

export async function generateMetadata({ params }) {
    try {
        const dealership = await getDealershipBySlug(params.slug);

        if (!dealership.success || !dealership.data) {
            return {
                title: "Dealership Not Found - AutoMe",
                description: "The requested dealership could not be found.",
            };
        }

        const { name, description, location, logo, carCount } = dealership.data;

        const title = `${name} - AutoMe Dealership`;
        const desc = description || `View ${name}'s inventory, reviews, and contact information. ${carCount || 0} cars available.`;

        return {
            title,
            description: desc,
            keywords: [name, "dealership", "car dealership", "automotive", "cars for sale", location?.city, location?.state].filter(Boolean).join(", "),
            openGraph: {
                title,
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
                title,
                description: desc,
                images: [logo || "/og-image.jpg"],
            },
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: "Dealership - AutoMe",
            description: "View dealership information on AutoMe",
        };
    }
}

const DealershipDetailPage = () => {
    return <DealershipDetailPresenter />;
};

export default DealershipDetailPage;
