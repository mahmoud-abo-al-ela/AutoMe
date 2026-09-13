import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Browse Dealerships",
    description: "Find the perfect dealership for your next vehicle purchase. Browse our directory of automotive dealerships with ratings, reviews, and available cars.",
    keywords: ["dealerships", "car dealerships", "automotive", "buy cars", "car sales", "vehicle dealership"],
    openGraph: {
        title: "Browse Dealerships",
        description: "Find the perfect dealership for your next vehicle purchase",
        type: "website",
    },
};

export default async function DealershipsLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <>{children}</>;
}
