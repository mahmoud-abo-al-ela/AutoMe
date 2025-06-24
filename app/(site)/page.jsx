import Hero from "@/components/Hero/Hero";
import Featured from "@/components/FeaturedCars/Featured";
import Why from "@/components/Why/Why";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden">
      <Hero />
      <Featured />
      <Why />
      <CTA />
    </main>
  );
}
