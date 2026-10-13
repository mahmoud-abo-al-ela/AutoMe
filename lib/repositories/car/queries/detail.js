// One car: its page, what the listing assistant reads, and the dealer's other stock.

import { db } from "@/lib/prisma";
import { serializeCar } from "@/lib/utils/serializers";
import { publicCarWhere } from "../visibility";

/** The dealership as a public car page shows it, with its standing terms. */
export const WITH_DEALERSHIP = {
  organization: {
    select: {
      name: true,
      logo: true,
      slug: true,
      city: true,
      region: true,
      phone: true,
      address: true,
      // The dealership's standing terms, shown on every one of its listings.
      offersFinancing: true,
      financingNote: true,
      acceptsTradeIn: true,
      allowsInspection: true,
      offersDelivery: true,
    },
  },
};

/**
 * Find a single car by ID, whatever its status or dealership — for the
 * dealer's own pages and internal work. Public pages use findPublicCarById.
 */
export async function findCarById(id) {
  const car = await db.car.findUnique({ where: { id }, include: WITH_DEALERSHIP });
  return serializeCar(car);
}

/**
 * A car as the public may open it (visibility.ts): available or sold, of an
 * active dealership. Anything else is null — the same as a missing id.
 *
 * @param {string} id
 */
export async function findPublicCarById(id) {
  const car = await db.car.findFirst({ where: { id, ...publicCarWhere("detail") }, include: WITH_DEALERSHIP });
  return serializeCar(car);
}

/**
 * The car as the buyer assistant may see it: the public listing fields, the
 * dealership's public details and its working hours — nothing else. An
 * explicit select, so a column added to Car later is not handed to the model
 * until someone decides it should be.
 *
 * Not serialized: `price` stays a Decimal for the caller to convert.
 *
 * @param {string} id
 */
export async function findCarForAssistant(id) {
  // A public answer about a public car only: a hidden one is not found, so its
  // cached answers (keyed on the record) are never reached either.
  return db.car.findFirst({
    where: { id, ...publicCarWhere("detail") },
    select: {
      id: true,
      organizationId: true,
      make: true,
      model: true,
      year: true,
      bodyType: true,
      color: true,
      seats: true,
      fuelType: true,
      transmission: true,
      mileage: true,
      price: true,
      priceCurrency: true,
      status: true,
      title: true,
      titleEn: true,
      titleAr: true,
      description: true,
      descriptionEn: true,
      descriptionAr: true,
      features: true,
      featuresAr: true,
      originalPaint: true,
      accidentFree: true,
      ownerCount: true,
      serviceHistory: true,
      priceNegotiable: true,
      licenseValidUntil: true,
      images: true,
      imageAlts: true,
      createdAt: true,
      organization: {
        select: {
          name: true,
          description: true,
          website: true,
          averageRating: true,
          totalReviews: true,
          offersFinancing: true,
          financingNote: true,
          acceptsTradeIn: true,
          allowsInspection: true,
          offersDelivery: true,
          city: true,
          region: true,
          address: true,
          phone: true,
          workingHours: {
            select: { dayOfWeek: true, openTime: true, closeTime: true, isOpen: true },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
    },
  });
}

/**
 * The dealership's other cars on sale, for the assistant to offer as
 * alternatives. Same organization only — the id is the car's own, read from
 * the database — and only what the public listing shows. The id and photos
 * are for the cards linking to a car an answer names, never sent to a model.
 *
 * @param {string} organizationId
 * @param {string} excludeCarId
 * @param {number} [take]
 */
export async function findOtherAvailableCars(organizationId, excludeCarId, take = 40) {
  return db.car.findMany({
    where: { organizationId, status: "AVAILABLE", id: { not: excludeCarId } },
    select: {
      id: true,
      images: true,
      year: true,
      make: true,
      model: true,
      color: true,
      price: true,
      mileage: true,
      bodyType: true,
      transmission: true,
      fuelType: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
