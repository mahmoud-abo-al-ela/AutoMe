import type { ModelKey } from "./photos";

export type StockItem = {
  model: ModelKey;
  year: number;
  km: number;
  price: number;
  owners?: number;
  service?: "FULL" | "PARTIAL" | "NONE";
  repainted?: boolean;
  featured?: boolean;
  sold?: boolean;
  /** Days since it was listed. */
  listed: number;
};

export type DemoDealership = {
  slug: string;
  name: string;
  /** lib/locations city slug; the governorate is looked up from it. */
  city: string;
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  /** The street only: the city and governorate are added from the location table (create-demo.ts). */
  street: { en: string; ar: string };
  about: { en: string; ar: string };
  /** The financing note in both languages, as the profile translation would store it. */
  terms: {
    offersFinancing: boolean;
    financingNote: { en: string; ar: string } | null;
    acceptsTradeIn: boolean;
    allowsInspection: boolean;
    offersDelivery: boolean;
  };
  owner: { name: string; key: string };
  staff?: { name: string; key: string };
  stock: StockItem[];
};

export const DEALERSHIPS: DemoDealership[] = [
  {
    slug: "nile-crest-motors",
    name: "Nile Crest Motors",
    city: "new-cairo",
    plan: "ENTERPRISE",
    street: { en: "90th Street, Fifth Settlement", ar: "شارع التسعين، التجمع الخامس" },
    about: {
      en: "Inspected used cars from mainstream and premium brands, each with a 150-point check report.",
      ar: "سيارات مستعملة مفحوصة من العلامات الشائعة والفاخرة، ولكل سيارة تقرير فحص من 150 نقطة.",
    },
    terms: { offersFinancing: true, financingNote: { en: "Bank financing over up to 5 years, from 30% down", ar: "تمويل بنكي حتى ٥ سنوات بمقدم يبدأ من ٣٠٪" }, acceptsTradeIn: true, allowsInspection: true, offersDelivery: true },
    owner: { name: "Karim Abdelaziz", key: "nile-crest-owner" },
    staff: { name: "Nour Hamdy", key: "nile-crest-sales" },
    stock: [
      { model: "c200-w205", year: 2020, km: 64_000, price: 3_250_000, owners: 1, service: "FULL", featured: true, listed: 6 },
      { model: "bmw-g20", year: 2021, km: 41_000, price: 3_450_000, owners: 1, service: "FULL", featured: true, listed: 12 },
      { model: "tucson-nx4", year: 2023, km: 22_000, price: 2_350_000, owners: 1, service: "FULL", listed: 3 },
      { model: "peugeot-3008", year: 2021, km: 55_000, price: 1_850_000, owners: 1, service: "FULL", listed: 21 },
      { model: "fortuner-an160", year: 2021, km: 60_000, price: 2_900_000, owners: 1, service: "PARTIAL", listed: 9 },
      { model: "sportage-ql", year: 2020, km: 78_000, price: 1_480_000, owners: 2, service: "PARTIAL", listed: 33 },
      { model: "corolla-e210", year: 2023, km: 18_000, price: 1_550_000, owners: 1, service: "FULL", listed: 2 },
      { model: "qashqai-j11", year: 2021, km: 49_000, price: 1_450_000, owners: 1, service: "FULL", listed: 15 },
      { model: "elantra-cn7", year: 2023, km: 25_000, price: 1_520_000, owners: 1, service: "FULL", sold: true, listed: 40 },
      { model: "tiggo7pro", year: 2023, km: 20_000, price: 1_280_000, owners: 1, service: "FULL", listed: 5 },
    ],
  },
  {
    slug: "zayed-auto-house",
    name: "Zayed Auto House",
    city: "sheikh-zayed",
    plan: "PRO",
    street: { en: "Beverly Hills Road", ar: "طريق بيفرلي هيلز" },
    about: {
      en: "Family SUVs and sedans for West Cairo, with an independent inspection welcome on every car.",
      ar: "سيارات عائلية رياضية وسيدان لسكان غرب القاهرة، ونرحب بالفحص المستقل لأي سيارة.",
    },
    terms: { offersFinancing: true, financingNote: { en: "Instalments through partner banks", ar: "تقسيط عبر البنوك الشريكة" }, acceptsTradeIn: true, allowsInspection: true, offersDelivery: false },
    owner: { name: "Hoda El-Sayed", key: "zayed-owner" },
    stock: [
      { model: "tucson-nx4", year: 2022, km: 41_000, price: 2_150_000, owners: 1, service: "FULL", featured: true, listed: 8 },
      { model: "elantra-cn7", year: 2022, km: 48_000, price: 1_380_000, owners: 1, service: "FULL", listed: 14 },
      { model: "mg-zs", year: 2022, km: 35_000, price: 960_000, owners: 1, service: "FULL", listed: 4 },
      { model: "cerato-bd", year: 2021, km: 62_000, price: 1_050_000, owners: 1, service: "PARTIAL", listed: 19 },
      { model: "corolla-e210", year: 2021, km: 58_000, price: 1_280_000, owners: 1, service: "FULL", listed: 26 },
      { model: "sportage-ql", year: 2019, km: 96_000, price: 1_350_000, owners: 2, service: "PARTIAL", repainted: true, listed: 37 },
      { model: "picanto-ja", year: 2022, km: 28_000, price: 690_000, owners: 1, service: "FULL", listed: 7 },
      { model: "qashqai-j11", year: 2020, km: 71_000, price: 1_350_000, owners: 2, service: "PARTIAL", sold: true, listed: 45 },
      { model: "peugeot-3008", year: 2019, km: 88_000, price: 1_550_000, owners: 2, service: "PARTIAL", listed: 30 },
      { model: "c200-w205", year: 2019, km: 92_000, price: 2_950_000, owners: 2, service: "FULL", listed: 11 },
    ],
  },
  {
    slug: "smouha-car-center",
    name: "Smouha Car Center",
    city: "smouha",
    plan: "PRO",
    street: { en: "Victor Emmanuel Square", ar: "ميدان فيكتور عمانويل" },
    about: {
      en: "Alexandria's everyday-car specialist: economical sedans and family SUVs, all with known history.",
      ar: "متخصصون في السيارات اليومية بالإسكندرية: سيدان اقتصادية وسيارات عائلية رياضية، وكلها معروفة التاريخ.",
    },
    terms: { offersFinancing: false, financingNote: null, acceptsTradeIn: true, allowsInspection: true, offersDelivery: false },
    owner: { name: "Tarek Mansour", key: "smouha-owner" },
    staff: { name: "Omar Khaled", key: "smouha-sales" },
    stock: [
      { model: "corolla-e210", year: 2020, km: 84_000, price: 1_180_000, owners: 2, service: "PARTIAL", featured: true, listed: 10 },
      { model: "elantra-ad", year: 2020, km: 77_000, price: 1_000_000, owners: 1, service: "FULL", listed: 16 },
      { model: "accent-rb", year: 2018, km: 118_000, price: 610_000, owners: 2, service: "PARTIAL", repainted: true, listed: 28 },
      { model: "sunny-n17", year: 2022, km: 46_000, price: 720_000, owners: 1, service: "FULL", listed: 5 },
      { model: "cerato-bd", year: 2022, km: 37_000, price: 1_150_000, owners: 1, service: "FULL", listed: 3 },
      { model: "mg-zs", year: 2021, km: 58_000, price: 880_000, owners: 1, service: "PARTIAL", listed: 22 },
      { model: "tiggo7pro", year: 2022, km: 39_000, price: 1_150_000, owners: 1, service: "FULL", listed: 13 },
      { model: "fortuner-an160", year: 2019, km: 104_000, price: 2_450_000, owners: 2, service: "FULL", listed: 35 },
      { model: "picanto-ja", year: 2020, km: 61_000, price: 590_000, owners: 2, service: "PARTIAL", sold: true, listed: 50 },
      { model: "logan", year: 2020, km: 82_000, price: 520_000, owners: 1, service: "PARTIAL", listed: 18 },
    ],
  },
  {
    slug: "delta-drive",
    name: "Delta Drive",
    city: "mansoura",
    plan: "STARTER",
    street: { en: "El Gomhoreya Street", ar: "شارع الجمهورية" },
    about: {
      en: "Affordable, honest cars for the Delta, priced to sell and ready to drive away.",
      ar: "سيارات بأسعار معقولة وبوصف صادق لأهل الدلتا، جاهزة للاستلام فورًا.",
    },
    terms: { offersFinancing: false, financingNote: null, acceptsTradeIn: true, allowsInspection: true, offersDelivery: false },
    owner: { name: "Mahmoud Shalaby", key: "delta-owner" },
    stock: [
      { model: "elantra-ad", year: 2019, km: 98_000, price: 920_000, owners: 2, service: "PARTIAL", featured: true, listed: 9 },
      { model: "sunny-n17", year: 2020, km: 88_000, price: 640_000, owners: 2, service: "PARTIAL", listed: 17 },
      { model: "logan", year: 2019, km: 110_000, price: 470_000, owners: 3, service: "NONE", repainted: true, listed: 31 },
      { model: "accent-rb", year: 2017, km: 134_000, price: 560_000, owners: 2, service: "PARTIAL", listed: 24 },
      { model: "cerato-bd", year: 2020, km: 79_000, price: 960_000, owners: 1, service: "FULL", listed: 12 },
      { model: "sportage-ql", year: 2020, km: 82_000, price: 1_480_000, owners: 1, service: "FULL", listed: 6 },
      { model: "mg-zs", year: 2022, km: 31_000, price: 960_000, owners: 1, service: "FULL", listed: 4 },
      { model: "corolla-e210", year: 2021, km: 66_000, price: 1_280_000, owners: 1, service: "FULL", sold: true, listed: 42 },
      { model: "tiggo7pro", year: 2023, km: 17_000, price: 1_280_000, owners: 1, service: "FULL", listed: 2 },
      { model: "picanto-ja", year: 2022, km: 33_000, price: 690_000, owners: 1, service: "FULL", listed: 14 },
    ],
  },
  {
    slug: "canal-motors",
    name: "Canal Motors",
    city: "ismailia-city",
    plan: "STARTER",
    street: { en: "Mohamed Ali Street", ar: "شارع محمد علي" },
    about: {
      en: "Serving Ismailia, Port Said and Suez with checked used cars and straightforward prices.",
      ar: "نخدم الإسماعيلية وبورسعيد والسويس بسيارات مستعملة مفحوصة وأسعار واضحة.",
    },
    terms: { offersFinancing: true, financingNote: { en: "Instalments over up to 3 years", ar: "تقسيط حتى ٣ سنوات" }, acceptsTradeIn: false, allowsInspection: true, offersDelivery: true },
    owner: { name: "Yasser Abdelrahman", key: "canal-owner" },
    stock: [
      { model: "sunny-n17", year: 2023, km: 21_000, price: 760_000, owners: 1, service: "FULL", featured: true, listed: 4 },
      { model: "elantra-cn7", year: 2021, km: 69_000, price: 1_250_000, owners: 1, service: "PARTIAL", listed: 15 },
      { model: "accent-rb", year: 2018, km: 101_000, price: 610_000, owners: 2, service: "PARTIAL", listed: 27 },
      { model: "qashqai-j11", year: 2021, km: 52_000, price: 1_450_000, owners: 1, service: "FULL", listed: 8 },
      { model: "logan", year: 2020, km: 74_000, price: 520_000, owners: 1, service: "PARTIAL", listed: 20 },
      { model: "mg-zs", year: 2021, km: 64_000, price: 880_000, owners: 2, service: "PARTIAL", sold: true, listed: 39 },
      { model: "tucson-nx4", year: 2021, km: 77_000, price: 1_950_000, owners: 1, service: "FULL", listed: 11 },
      { model: "corolla-e210", year: 2020, km: 91_000, price: 1_180_000, owners: 2, service: "PARTIAL", listed: 23 },
      { model: "cerato-bd", year: 2021, km: 55_000, price: 1_050_000, owners: 1, service: "FULL", listed: 6 },
    ],
  },
  {
    slug: "luxor-auto-point",
    name: "Luxor Auto Point",
    city: "luxor-city",
    plan: "STARTER",
    street: { en: "Television Street", ar: "شارع التلفزيون" },
    about: {
      en: "Upper Egypt's place for tough, easy-to-service cars that handle the heat and long distances.",
      ar: "وجهة الصعيد للسيارات المتينة سهلة الصيانة، التي تتحمل الحرارة والمسافات الطويلة.",
    },
    terms: { offersFinancing: false, financingNote: null, acceptsTradeIn: true, allowsInspection: true, offersDelivery: false },
    owner: { name: "Amr Fawzy", key: "luxor-owner" },
    stock: [
      { model: "fortuner-an160", year: 2021, km: 72_000, price: 2_900_000, owners: 1, service: "FULL", featured: true, listed: 7 },
      { model: "sunny-n17", year: 2022, km: 49_000, price: 720_000, owners: 1, service: "FULL", listed: 12 },
      { model: "elantra-ad", year: 2020, km: 83_000, price: 1_000_000, owners: 2, service: "PARTIAL", listed: 18 },
      { model: "tiggo7pro", year: 2022, km: 44_000, price: 1_150_000, owners: 1, service: "FULL", listed: 5 },
      { model: "accent-rb", year: 2017, km: 141_000, price: 560_000, owners: 3, service: "NONE", repainted: true, listed: 29 },
      { model: "sportage-ql", year: 2019, km: 101_000, price: 1_350_000, owners: 2, service: "PARTIAL", listed: 21 },
      { model: "picanto-ja", year: 2020, km: 66_000, price: 590_000, owners: 1, service: "PARTIAL", sold: true, listed: 44 },
      { model: "logan", year: 2019, km: 122_000, price: 470_000, owners: 2, service: "PARTIAL", listed: 33 },
    ],
  },
];

/** Buyers who save cars, book drives, ask questions and leave reviews. */
export const BUYERS = [
  "Ahmed Samir", "Mariam Adel", "Youssef Gamal", "Sara Ibrahim", "Mostafa Ragab",
  "Nada Hesham", "Hassan Mahmoud", "Reem Ashraf", "Islam Tawfik", "Dina Fouad",
];
