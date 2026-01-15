import Hero from "@/components/Hero/Hero";
import Featured from "@/components/FeaturedCars/Featured";
import Why from "@/components/Why/Why";
import ReservationCTA from "@/components/ReservationCTA";
import { getOrganizationBySlug } from "@/lib/getOrganization";
import { notFound } from "next/navigation";

export default async function OrganizationHomePage({ params }) {
    const { slug } = await params;
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
        notFound();
    }

    return (
        <main className="flex flex-col min-h-screen overflow-x-hidden">
            <Hero />
            <Featured />
            <Why />
            <ReservationCTA />
        </main>
    );
}
