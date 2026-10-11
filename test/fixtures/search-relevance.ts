/**
 * The keyword relevance catalogue: one dealership's inventory, written the way
 * Egyptian dealers write it, with the competition a real search has to rank
 * through — several Toyotas, an X5 beside an X3 and a Kia sold as "X5-like",
 * a Kia that is "better than a Corolla", a sunroof tagged on some cars and only
 * mentioned in prose on others, and generic words ("عربية", "car") in some
 * descriptions but not others.
 *
 * Every car has its own createdAt, so a tie in rank orders the same way on
 * every run: the measurements are exact, not noisy.
 *
 * Unlike lib/ai/evaluation/search-fixtures.ts (one car per model, written for
 * the meaning evaluation against a live model), this is for the words alone and
 * runs offline against real Postgres.
 */

export type RelevanceCar = {
  make: string;
  model: string;
  year: number;
  bodyType: string;
  transmission: "Automatic" | "Manual";
  fuelType?: string;
  color?: string;
  price?: number;
  status?: "AVAILABLE" | "SOLD";
  descriptionEn?: string;
  descriptionAr?: string;
  features?: string[];
  featuresAr?: string[];
};

export const CARS = {
  corolla20: { make: "Toyota", model: "Corolla", year: 2020, bodyType: "Sedan", transmission: "Automatic", color: "White", features: ["Sunroof", "Rear camera"], descriptionEn: "Single owner, full agency service, very economical." },
  corolla18: { make: "Toyota", model: "Corolla", year: 2018, bodyType: "Sedan", transmission: "Manual", color: "Silver", descriptionAr: "عربية فبريكا بالكامل، صيانات توكيل." },
  yaris: { make: "Toyota", model: "Yaris", year: 2021, bodyType: "Hatchback", transmission: "Automatic", color: "Red", descriptionEn: "Great first car for the city." },
  hilux: { make: "Toyota", model: "Hilux", year: 2019, bodyType: "Pickup", transmission: "Manual", fuelType: "Diesel", color: "White", descriptionEn: "Work truck, 4x4." },
  landCruiser: { make: "Toyota", model: "Land Cruiser", year: 2022, bodyType: "SUV", transmission: "Automatic", color: "Black", features: ["Leather seats"], descriptionEn: "Sunroof, leather seats, seven seats." },
  camry: { make: "Toyota", model: "Camry", year: 2021, bodyType: "Sedan", transmission: "Automatic", color: "Black", features: ["Sunroof"], descriptionAr: "سيارة نظيفة جدا." },
  prius: { make: "Toyota", model: "Prius", year: 2019, bodyType: "Hatchback", transmission: "Automatic", fuelType: "Hybrid", color: "Silver" },
  elantra: { make: "Hyundai", model: "Elantra", year: 2019, bodyType: "Sedan", transmission: "Automatic", color: "Silver", descriptionAr: "عربية موفرة جدا في البنزين." },
  tucson: { make: "Hyundai", model: "Tucson", year: 2020, bodyType: "SUV", transmission: "Automatic", color: "White", featuresAr: ["فتحة سقف"], descriptionAr: "عائلية واسعة، فبريكا." },
  accent: { make: "Hyundai", model: "Accent", year: 2018, bodyType: "Sedan", transmission: "Manual", color: "Blue", descriptionEn: "Clean car, never crashed." },
  i10: { make: "Hyundai", model: "Grand i10", year: 2021, bodyType: "Hatchback", transmission: "Manual", color: "Red", descriptionEn: "Small and easy to park." },
  h1: { make: "Hyundai", model: "H1", year: 2018, bodyType: "Wagon", transmission: "Manual", fuelType: "Diesel", color: "White", descriptionEn: "Nine seats, ideal for a big family." },
  cerato18: { make: "Kia", model: "Cerato", year: 2018, bodyType: "Sedan", transmission: "Manual", color: "White", descriptionEn: "Cheap to maintain. Drives better than a Corolla." },
  cerato21: { make: "Kia", model: "Cerato", year: 2021, bodyType: "Sedan", transmission: "Automatic", color: "Red" },
  sportage: { make: "Kia", model: "Sportage", year: 2021, bodyType: "SUV", transmission: "Automatic", color: "Grey", features: ["Panoramic roof"], descriptionEn: "X5-like comfort at half the price." },
  picanto: { make: "Kia", model: "Picanto", year: 2022, bodyType: "Hatchback", transmission: "Automatic", color: "Yellow", descriptionAr: "صغيرة وسهلة الركن." },
  sorento: { make: "Kia", model: "Sorento", year: 2020, bodyType: "SUV", transmission: "Automatic", color: "Black", descriptionEn: "Seven seats." },
  x5: { make: "BMW", model: "X5", year: 2022, bodyType: "SUV", transmission: "Automatic", color: "Black", features: ["Sunroof", "Leather seats"], descriptionEn: "M Sport package." },
  x3: { make: "BMW", model: "X3", year: 2021, bodyType: "SUV", transmission: "Automatic", color: "White", descriptionEn: "Compact luxury SUV." },
  bmw320: { make: "BMW", model: "320i", year: 2019, bodyType: "Sedan", transmission: "Automatic", color: "Blue", descriptionEn: "Sport line." },
  eClass: { make: "Mercedes-Benz", model: "E-Class", year: 2020, bodyType: "Sedan", transmission: "Automatic", color: "Black", descriptionAr: "عربية فخمة، فتحة سقف." },
  cClass: { make: "Mercedes-Benz", model: "C-Class", year: 2019, bodyType: "Sedan", transmission: "Automatic", color: "White" },
  sunny: { make: "Nissan", model: "Sunny", year: 2020, bodyType: "Sedan", transmission: "Manual", color: "White", descriptionAr: "عربية اقتصادية." },
  xTrail: { make: "Nissan", model: "X-Trail", year: 2019, bodyType: "SUV", transmission: "Automatic", color: "Silver" },
  qashqai: { make: "Nissan", model: "Qashqai", year: 2021, bodyType: "SUV", transmission: "Automatic", color: "Red" },
  model3: { make: "Tesla", model: "Model 3", year: 2022, bodyType: "Sedan", transmission: "Automatic", fuelType: "Electric", color: "White" },
  mustang: { make: "Ford", model: "Mustang", year: 2018, bodyType: "Coupe", transmission: "Automatic", color: "Red" },
  focus: { make: "Ford", model: "Focus", year: 2017, bodyType: "Hatchback", transmission: "Manual", color: "Blue", descriptionEn: "Reliable family car." },
  megane: { make: "Renault", model: "Megane", year: 2019, bodyType: "Sedan", transmission: "Manual", color: "Grey" },
  logan: { make: "Renault", model: "Logan", year: 2020, bodyType: "Sedan", transmission: "Manual", color: "White", descriptionAr: "سيارة اقتصادية للمدينة." },
  golf: { make: "Volkswagen", model: "Golf", year: 2020, bodyType: "Hatchback", transmission: "Automatic", color: "Black" },
  passat: { make: "Volkswagen", model: "Passat", year: 2018, bodyType: "Sedan", transmission: "Automatic", color: "Silver" },
  octavia: { make: "Skoda", model: "Octavia", year: 2021, bodyType: "Sedan", transmission: "Automatic", color: "White" },
  mg5: { make: "MG", model: "5", year: 2022, bodyType: "Sedan", transmission: "Automatic", color: "Red" },
  tiggo: { make: "Chery", model: "Tiggo 7", year: 2023, bodyType: "SUV", transmission: "Automatic", color: "Grey" },
  civic: { make: "Honda", model: "Civic", year: 2020, bodyType: "Sedan", transmission: "Automatic", color: "Black", features: ["Sunroof"] },
  crv: { make: "Honda", model: "CR-V", year: 2019, bodyType: "SUV", transmission: "Automatic", color: "White" },
  // Never a result: sold, so outside the default (available) scope.
  corollaSold: { make: "Toyota", model: "Corolla", year: 2022, bodyType: "Sedan", transmission: "Automatic", color: "White", status: "SOLD", descriptionAr: "عربية سيدان مباعة." },
} satisfies Record<string, RelevanceCar>;

export type CarKey = keyof typeof CARS;

/** Cars of another dealership, and of a suspended one — never in this one's results. */
export const OTHER_TENANT_CARS: Record<string, RelevanceCar> = {
  otherCorolla: { make: "Toyota", model: "Corolla", year: 2023, bodyType: "Sedan", transmission: "Automatic", color: "White", features: ["Sunroof"], descriptionAr: "عربية سيدان فبريكا." },
  otherX5: { make: "BMW", model: "X5", year: 2023, bodyType: "SUV", transmission: "Automatic", color: "Black" },
};

export const HIDDEN_TENANT_CARS: Record<string, RelevanceCar> = {
  hiddenSedan: { make: "Toyota", model: "Corolla", year: 2023, bodyType: "Sedan", transmission: "Automatic", color: "White", descriptionAr: "عربية سيدان." },
};

const where = (predicate: (car: RelevanceCar) => boolean): CarKey[] =>
  (Object.keys(CARS) as CarKey[]).filter((key) => (CARS[key] as RelevanceCar).status !== "SOLD" && predicate(CARS[key]));

const SEDANS = where((c) => c.bodyType === "Sedan");
const TOYOTAS = where((c) => c.make === "Toyota");
const HYUNDAIS = where((c) => c.make === "Hyundai");

export type RelevanceQuery = {
  query: string;
  lang: "en" | "ar";
  /** What the buyer is looking for. */
  relevant: CarKey[];
  /** Not what was asked, but a fair thing to show — not counted against the search. */
  acceptable?: CarKey[];
  /** A navigational query's one intended car: its rank is measured on its own. */
  target?: CarKey;
};

export const QUERIES: RelevanceQuery[] = [
  // The reported bug: a generic word beside the one that matters.
  { query: "عربية سيدان", lang: "ar", relevant: SEDANS },
  { query: "سيدان", lang: "ar", relevant: SEDANS },
  { query: "لو سمحت تويوتا", lang: "ar", relevant: TOYOTAS },
  { query: "تويوتا", lang: "ar", relevant: TOYOTAS },
  { query: "هيونداي", lang: "ar", relevant: HYUNDAIS },
  { query: "سيدان أوتوماتيك", lang: "ar", relevant: where((c) => c.bodyType === "Sedan" && c.transmission === "Automatic"), acceptable: SEDANS },
  { query: "فتحة سقف", lang: "ar", relevant: ["tucson", "eClass"], acceptable: ["corolla20", "camry", "x5", "civic", "landCruiser"] },
  { query: "تويوتا كورولا", lang: "ar", relevant: ["corolla20", "corolla18"], acceptable: TOYOTAS },
  // English.
  { query: "toyota", lang: "en", relevant: TOYOTAS },
  { query: "corolla", lang: "en", relevant: ["corolla20", "corolla18"] },
  { query: "toyota corolla 2020", lang: "en", relevant: ["corolla20"], acceptable: ["corolla18"], target: "corolla20" },
  { query: "bmw x5", lang: "en", relevant: ["x5"], acceptable: ["x3", "bmw320"], target: "x5" },
  { query: "x5", lang: "en", relevant: ["x5"], target: "x5" },
  { query: "toyota sunroof", lang: "en", relevant: ["corolla20", "camry", "landCruiser"], acceptable: TOYOTAS },
  { query: "car sedan", lang: "en", relevant: SEDANS },
  { query: "automatic suv", lang: "en", relevant: where((c) => c.bodyType === "SUV" && c.transmission === "Automatic") },
  { query: "white sedan", lang: "en", relevant: where((c) => c.bodyType === "Sedan" && c.color === "White"), acceptable: SEDANS },
  { query: "electric", lang: "en", relevant: ["model3"], target: "model3" },
  { query: "civic", lang: "en", relevant: ["civic"], target: "civic" },
];
