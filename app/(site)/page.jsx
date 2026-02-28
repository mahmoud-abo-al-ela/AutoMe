import Hero from "@/components/Hero/Hero";
import Featured from "@/components/FeaturedCars/Featured";
import Why from "@/components/Why/Why";
import ReservationCTA from "@/components/ReservationCTA";
import CTA from "@/components/CTA";
import DealerCTA from "@/components/DealerCTA";
import Stats from "@/components/Stats/Stats";
import Testimonials from "@/components/Testimonials/Testimonials";
import Pricing from "@/components/Pricing/Pricing";
import FAQ from "@/components/FAQ/FAQ";
import { getActivePlans } from "@/actions/billing";

export default async function Home() {
  const plans = await getActivePlans();

  return (
    <>
      <main className="flex flex-col min-h-screen overflow-x-hidden">
        <Hero />
        <Stats />
        <Featured />
        <Why />
        <Testimonials />
        <ReservationCTA />
        <Pricing plans={plans} />
        <DealerCTA />
        <FAQ />
        <CTA />
      </main>
    </>
  );
}
