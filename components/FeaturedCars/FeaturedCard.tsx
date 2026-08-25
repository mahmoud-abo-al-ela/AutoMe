"use client";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { GalleryHorizontal } from "lucide-react";
import { getFeaturedCars } from "@/actions/home";
import CarCard from "../CarCard";
import CarCardSkeleton from "../CarCardSkeleton";
import { Link } from "@/i18n/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Required rather than defaulted: an English default here would silently
// reappear in the Arabic tree if anything ever rendered this directly.
const FeaturedCard = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  const t = useTranslations("home.featured");
  const {
    data: featuredCars,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.cars.featured(),
    queryFn: () => getFeaturedCars(),
  });

  return (
    <section id="featured" className="py-8 sm:py-16 bg-muted">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="max-w-lg">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground">{subtitle}</p>
          </div>

          <Link href="/cars" className="w-full md:w-auto">
            <Button
              variant="default"
              size="lg"
              className="bg-primary hover:bg-primary/90 cursor-pointer text-primary-foreground rounded-full px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto"
            >
              <GalleryHorizontal className="me-2 h-4 w-4" /> {t("viewAll")}
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
                      className="p-5 basis-full sm:basis-1/2 md:basis-1/3"
                    >
                      <div className="transform transition-all duration-300">
                        <CarCardSkeleton />
                      </div>
                    </CarouselItem>
                  ))
              : // getFeaturedCars returns an ActionResponse, so `.data` only
                // exists on the success branch. The old unnarrowed read
                // produced undefined on failure and rendered nothing; so does
                // this, but now the failure case is visible in the code.
                // serializeCar maps null rows to null, so the action's array is
                // nullable per element; those entries never rendered anything
                // useful and are dropped rather than guarded at every field.
                (featuredCars?.success ? featuredCars.data : [])
                  ?.filter((car) => car !== null)
                  .map((car) => (
                  <CarouselItem
                    key={car.id}
                    className="p-5 basis-full sm:basis-1/2 md:basis-1/3"
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
