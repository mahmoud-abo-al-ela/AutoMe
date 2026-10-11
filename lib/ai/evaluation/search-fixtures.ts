import type { CarForEmbedding } from "@/lib/services/car/embedding-text";

/**
 * The search evaluation's catalogue: listings as Egyptian dealers write them,
 * and what buyers type looking for them — in English, Modern Standard Arabic
 * and Egyptian Arabic, often in words the listing never uses.
 */

const base: Omit<CarForEmbedding, "make" | "model" | "year" | "bodyType"> = {
  fuelType: "Gasoline",
  title: null,
  titleEn: null,
  titleAr: null,
  description: null,
  descriptionEn: null,
  descriptionAr: null,
  features: [],
  featuresAr: [],
};

export const CARS: Record<string, CarForEmbedding> = {
  sportage: { ...base, make: "Kia", model: "Sportage", year: 2021, bodyType: "SUV", descriptionEn: "Panoramic roof, spacious boot, ideal for a family.", features: ["Panoramic roof", "Rear camera"] },
  tucson: { ...base, make: "Hyundai", model: "Tucson", year: 2020, bodyType: "SUV", descriptionAr: "عربية عائلية واسعة، فبريكا بالكامل.", featuresAr: ["فتحة سقف"] },
  xtrail: { ...base, make: "Nissan", model: "X-Trail", year: 2019, bodyType: "SUV", descriptionEn: "Seven seats, third row, 4x4." },
  corolla: { ...base, make: "Toyota", model: "Corolla", year: 2020, bodyType: "Sedan", descriptionEn: "Very economical on fuel, single owner, full agency service." },
  elantra: { ...base, make: "Hyundai", model: "Elantra", year: 2019, bodyType: "Sedan", descriptionAr: "موفرة جدًا في البنزين، صيانات توكيل." },
  cerato: { ...base, make: "Kia", model: "Cerato", year: 2018, bodyType: "Sedan", descriptionEn: "Manual gearbox, cheap to maintain." },
  i10: { ...base, make: "Hyundai", model: "Grand i10", year: 2021, bodyType: "Hatchback", descriptionEn: "Small and easy to park in the city, great first car." },
  picanto: { ...base, make: "Kia", model: "Picanto", year: 2022, bodyType: "Hatchback", descriptionAr: "صغيرة وسهلة الركن، مناسبة للمدينة." },
  bmwX5: { ...base, make: "BMW", model: "X5", year: 2022, bodyType: "SUV", descriptionEn: "Luxury SUV, M Sport package, leather interior, massage seats.", features: ["Leather seats", "Massage seats", "Harman Kardon"] },
  mercedesE: { ...base, make: "Mercedes-Benz", model: "E-Class", year: 2021, bodyType: "Sedan", descriptionEn: "Executive luxury sedan, AMG line, ambient lighting." },
  tesla: { ...base, make: "Tesla", model: "Model 3", year: 2022, bodyType: "Sedan", fuelType: "Electric", descriptionEn: "Fully electric, long range battery, autopilot." },
  priusHybrid: { ...base, make: "Toyota", model: "Prius", year: 2020, bodyType: "Hatchback", fuelType: "Hybrid", descriptionEn: "Hybrid, extremely low fuel consumption." },
  hilux: { ...base, make: "Toyota", model: "Hilux", year: 2019, bodyType: "Pickup", fuelType: "Diesel", descriptionEn: "Double cabin pickup, 4x4, built for work and off-road." },
  mustang: { ...base, make: "Ford", model: "Mustang", year: 2020, bodyType: "Coupe", descriptionEn: "V8 sports car, fast and loud." },
  miniConv: { ...base, make: "MINI", model: "Cooper", year: 2021, bodyType: "Convertible", descriptionEn: "Soft-top convertible, fun summer car." },
  h1: { ...base, make: "Hyundai", model: "H1", year: 2018, bodyType: "Wagon", fuelType: "Diesel", descriptionEn: "Nine-seat van, for large families or a business." },
};

/** What a buyer types, and the cars that answer it. */
export const QUERIES: { query: string; relevant: (keyof typeof CARS)[] }[] = [
  { query: "family car with a big boot", relevant: ["sportage", "tucson", "xtrail", "h1"] },
  { query: "عربية عائلية واسعة", relevant: ["sportage", "tucson", "xtrail", "h1"] },
  { query: "7 seater", relevant: ["xtrail", "h1"] },
  { query: "economical car that doesn't use much petrol", relevant: ["corolla", "elantra", "priusHybrid", "i10", "picanto"] },
  { query: "عربية موفرة في البنزين", relevant: ["corolla", "elantra", "priusHybrid", "i10", "picanto"] },
  { query: "small car for the city", relevant: ["i10", "picanto"] },
  { query: "عربية صغيرة سهلة الركن", relevant: ["i10", "picanto"] },
  { query: "luxury car", relevant: ["bmwX5", "mercedesE"] },
  { query: "سيارة فاخرة", relevant: ["bmwX5", "mercedesE"] },
  { query: "electric car", relevant: ["tesla"] },
  { query: "pickup for work", relevant: ["hilux"] },
  { query: "sports car", relevant: ["mustang", "miniConv"] },
];
