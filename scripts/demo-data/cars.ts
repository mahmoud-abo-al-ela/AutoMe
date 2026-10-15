import { PHOTOS } from "./photos";
import { MODELS } from "./models";
import type { StockItem } from "./dealerships";

const DAY = 86_400_000;

const MAKE_AR: Record<string, string> = {
  Hyundai: "هيونداي", Kia: "كيا", Toyota: "تويوتا", Nissan: "نيسان", MG: "إم جي", Chery: "شيري",
  Renault: "رينو", Peugeot: "بيجو", "Mercedes-Benz": "مرسيدس بنز", BMW: "بي إم دبليو",
};
const MODEL_AR: Record<string, string> = {
  Elantra: "إلنترا", Tucson: "توسان", Accent: "أكسنت", Sportage: "سبورتاج", Cerato: "سيراتو", Picanto: "بيكانتو",
  Corolla: "كورولا", Fortuner: "فورتشنر", Sunny: "صني", Qashqai: "قشقاي", ZS: "ZS", "Tiggo 7 Pro": "تيجو 7 برو",
  Logan: "لوجان", "3008": "3008", "C 200": "C 200", "320i": "320i",
};

const ORDINAL = { en: ["First", "Second", "Third"], ar: ["المالك الأول", "المالك الثاني", "المالك الثالث"] };

/** What the dealer says about the car, in both languages — the same facts the history fields hold. */
function condition(item: StockItem, licence: Date) {
  const owners = item.owners ?? 1;
  const month = `${String(licence.getUTCMonth() + 1).padStart(2, "0")}/${licence.getUTCFullYear()}`;
  const service = {
    FULL: { en: "full service history at the agency", ar: "سجل صيانة كامل لدى الوكيل" },
    PARTIAL: { en: "service records for most visits", ar: "سجلات صيانة لمعظم الزيارات" },
    NONE: { en: "no service records", ar: "لا توجد سجلات صيانة" },
  }[item.service ?? "PARTIAL"];
  const paint = item.repainted
    ? { en: "one panel repainted, no accidents", ar: "قطعة واحدة مُعاد دهانها، ولا حوادث" }
    : { en: "original paint throughout, no accidents", ar: "دهان أصلي بالكامل، ولا حوادث" };
  return {
    en: `${ORDINAL.en[owners - 1] ?? "Third"} owner, ${service.en}, ${paint.en}. Licensed until ${month}.`,
    ar: `${ORDINAL.ar[owners - 1] ?? "المالك الثالث"}، ${service.ar}، ${paint.ar}. الرخصة سارية حتى ${month}.`,
  };
}

/** One demo car, ready for prisma.car.create (organizationId added by the caller). */
export function carRow(item: StockItem, index: number, now: Date) {
  const spec = MODELS[item.model];
  const photos = PHOTOS[item.model];
  // Licences run a year or more out, spread across the months.
  const licence = new Date(Date.UTC(now.getUTCFullYear() + 1 + (index % 2), (index * 5) % 12, 1));
  const said = condition(item, licence);
  const credits = [...new Set(photos.map((p) => p.credit))].join("; ");
  const titleEn = `${item.year} ${spec.make} ${spec.model}`;
  const titleAr = `${MAKE_AR[spec.make]} ${MODEL_AR[spec.model]} ${item.year}`;
  const descriptionEn = `${spec.about.en} ${said.en}\n\nPhotos: ${credits}, via Wikimedia Commons (the model, not this exact car).`;
  const descriptionAr = `${spec.about.ar} ${said.ar}\n\nالصور: ${credits}، من ويكيميديا كومنز (للطراز، وليست للسيارة نفسها).`;
  const listedAt = new Date(now.getTime() - item.listed * DAY);
  return {
    make: spec.make,
    model: spec.model,
    year: item.year,
    price: item.price,
    priceCurrency: "EGP",
    mileage: item.km,
    fuelType: spec.fuelType,
    transmission: spec.transmission,
    color: spec.color,
    seats: spec.seats,
    bodyType: spec.bodyType,
    featured: item.featured ?? false,
    status: item.sold ? ("SOLD" as const) : ("AVAILABLE" as const),
    title: titleEn,
    titleEn,
    titleAr,
    description: descriptionEn,
    descriptionEn,
    descriptionAr,
    images: photos.map((p) => p.url),
    features: spec.features.en,
    featuresAr: spec.features.ar,
    originalPaint: !item.repainted,
    accidentFree: true,
    ownerCount: item.owners ?? 1,
    serviceHistory: item.service ?? "PARTIAL",
    priceNegotiable: item.price < 1_500_000,
    licenseValidUntil: licence,
    createdAt: listedAt,
    updatedAt: listedAt,
  };
}

/** Reviews a dealership has had, shown once approved; one set per dealership, rotated. */
export const REVIEWS = [
  { rating: 5, title: "Straight talk", comment: "Honest about the car's history and no pressure to buy. The car was exactly as described." },
  { rating: 4, title: "Good choice", comment: "Good choice of cars and a fair price. The paperwork took a day longer than promised." },
  { rating: 5, title: "تعامل محترم", comment: "تعامل محترم وشرح واضح لحالة السيارة قبل الشراء، وسمحوا بالفحص عند مركز مستقل." },
  { rating: 4, title: "تجربة جيدة", comment: "السيارة نظيفة والسعر مناسب، لكن الانتظار في المعرض كان طويلًا يوم الجمعة." },
  { rating: 3, title: "Fine, not great", comment: "The car is fine, but they would not move on the price at all." },
];

/** A question the assistant could not answer, as buyers ask them; some already answered by the dealer. */
export const QUESTIONS = [
  {
    locale: "en",
    question: "Is the price negotiable?",
    answer: "There is some room for a buyer paying in full. Visit us and we will agree it on the spot.",
  },
  { locale: "ar", question: "هل يمكن معاينة السيارة يوم الجمعة بعد الصلاة؟", answer: null },
  {
    locale: "ar",
    question: "هل الفحص عند مركز مستقل مسموح؟",
    answer: "نعم، يمكنك إحضار الفني الذي تختاره أو الفحص في أي مركز معتمد على نفقتك.",
  },
  { locale: "en", question: "Can you deliver it to Cairo?", answer: null },
];
