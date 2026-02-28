import { Metadata } from "next";

export const metadata = {
    title: "Browse Dealerships - AutoMe",
    description: "Find the perfect dealership for your next vehicle purchase. Browse our directory of automotive dealerships with ratings, reviews, and available cars.",
    keywords: ["dealerships", "car dealerships", "automotive", "buy cars", "car sales", "vehicle dealership"],
    openGraph: {
        title: "Browse Dealerships - AutoMe",
        description: "Find the perfect dealership for your next vehicle purchase",
        type: "website",
    },
};

export default function RootLayout({ children }) {
    return <>{children}</>;
}
