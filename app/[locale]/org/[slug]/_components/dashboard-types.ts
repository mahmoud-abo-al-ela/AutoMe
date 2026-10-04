import type { CarStatus } from "@/lib/generated/prisma";

/** Revenue metrics from the dashboard repository, via getAnalytics(). */
export type RevenueMetrics = {
  totalValue: number;
  averagePrice: number;
  addedThisMonth: number;
  addedLastMonth: number;
};

/** Conversion metrics from getConversionFunnel(), with its derived rates. */
export type ConversionFunnelData = {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  confirmedRate: number;
  completedRate: number;
};

/**
 * A wishlisted car from getPopularCarsData(). `price` arrives as a number: the
 * repository converts Car.price out of Prisma's Decimal before returning it.
 * `image` is the first image, or null when the car has none.
 */
export type PopularCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: CarStatus;
  image: string | null;
  savedCount: number;
};
