"use client";
import { Button } from "../ui/button";
import { GalleryHorizontal } from "lucide-react";
import { featuredCars } from "@/lib/FeaturedCars";
import CarCard from "../CarCard";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";

const FeaturedCard = ({
  title = "Featured Cars",
  subtitle = "Explore our curated selection of premium vehicles",
}) => {
  return (
    <section id="featured" className="py-16 bg-gray-100">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="max-w-lg">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-[#0532a3] bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-gray-600 text-lg">{subtitle}</p>
          </div>

          <Link href="/cars">
            <Button
              variant="default"
              size="lg"
              className="bg-[#0532a3] hover:bg-[#0532a3]/90 cursor-pointer text-white rounded-full px-8 shadow-lg hover:shadow-xl transition-all duration-300"
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
        >
          <CarouselContent>
            {featuredCars.map((car) => (
              <CarouselItem
                key={car.id}
                className="p-5 basis-full md:basis-1/3 "
              >
                <div className="transform hover:scale-[1.01] transition-all duration-300 ">
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
