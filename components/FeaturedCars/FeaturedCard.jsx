"use client";
import { Button } from "../ui/button";
import { GalleryHorizontal } from "lucide-react";
import { getFeaturedCars } from "@/actions/home";
import CarCard from "../CarCard";
import CarCardSkeleton from "../CarCardSkeleton";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";

const FeaturedCard = ({
  title = "Featured Cars",
  subtitle = "Explore our curated selection of premium vehicles",
}) => {
  const {
    data: featuredCars,
    loading,
    error,
    fn: fetchFeaturedCars,
  } = useFetch(getFeaturedCars, true);
  useEffect(() => {
    fetchFeaturedCars();
  }, []);

  return (
    <section id="featured" className="py-10 sm:py-16 bg-gray-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="max-w-lg">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary to-[#0532a3] bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-base sm:text-lg text-gray-600">{subtitle}</p>
          </div>

          <Link href="/cars" className="w-full md:w-auto">
            <Button
              variant="default"
              size="lg"
              className="bg-[#0532a3] hover:bg-[#0532a3]/90 cursor-pointer text-white rounded-full px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto"
            >
              <GalleryHorizontal className="mr-2 h-4 w-4" /> View All Vehicles
            </Button>
          </Link>
        </div>

        <Carousel
          opts={{
            loop: true,
            dragFree: false,
          }}
          plugins={[AutoPlay({ delay: 5000 })]}
          className="overflow-visible"
        >
          <CarouselContent>
            {loading
              ? Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <CarouselItem
                      key={`skeleton-${index}`}
                      className="p-2 sm:p-5 basis-full sm:basis-1/2 md:basis-1/3"
                    >
                      <div className="transform transition-all duration-300">
                        <CarCardSkeleton />
                      </div>
                    </CarouselItem>
                  ))
              : featuredCars?.data?.map((car) => (
                  <CarouselItem
                    key={car.id}
                    className="p-2 sm:p-5 basis-full sm:basis-1/2 md:basis-1/3"
                  >
                    <div className="transform hover:scale-[1.01] transition-all duration-300">
                      <CarCard car={car} />
                    </div>
                  </CarouselItem>
                ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default FeaturedCard;
