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
import { getCurrentOrganization } from "@/lib/getOrganization";

export default async function Home() {
  const organization = await getCurrentOrganization();
  const isOnSubdomain = !!organization;
  // The whole ActionResponse envelope used to be handed to <Pricing>, whose
  // `dbPlans.length > 0` check read undefined on it and quietly fell through to
  // the hardcoded default plans — so the homepage never showed real pricing.
  const plansResponse = isOnSubdomain ? null : await getActivePlans();
  const plans = plansResponse?.success ? plansResponse.data : null;
  const brandName = organization?.name || "AutoMe";

  return (
    <>
      <main className="flex flex-col min-h-screen overflow-x-hidden">
        <Hero />
        <Stats />
        <Featured />
        <Why />
        <Testimonials />
        <ReservationCTA />
        {!isOnSubdomain && <Pricing plans={plans} />}
        {!isOnSubdomain && <DealerCTA />}
        <FAQ brandName={brandName} />
        {!isOnSubdomain && <CTA />}
      </main>
    </>
  );
}
