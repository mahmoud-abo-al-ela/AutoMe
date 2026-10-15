import type { ModelKey } from "./photos";

/**
 * The models the demo dealerships sell: what Egyptian lots actually carry, the
 * generation the photos show, and the colour of the car in those photos — a
 * listing's colour field must match its pictures.
 */
export type ModelSpec = {
  make: string;
  model: string;
  bodyType: "Sedan" | "SUV" | "Hatchback";
  fuelType: "Gasoline" | "Diesel";
  transmission: "Automatic" | "Manual";
  seats: number;
  color: string;
  features: { en: string[]; ar: string[] };
  about: { en: string; ar: string };
};

const f = (pairs: [string, string][]) => ({ en: pairs.map(([en]) => en), ar: pairs.map(([, ar]) => ar) });

const SENSORS: [string, string] = ["Rear parking sensors", "حساسات ركن خلفية"];
const CAMERA: [string, string] = ["Rear camera", "كاميرا خلفية"];
const CARPLAY: [string, string] = ["Apple CarPlay and Android Auto", "Apple CarPlay وAndroid Auto"];
const CRUISE: [string, string] = ["Cruise control", "مثبت سرعة"];
const KEYLESS: [string, string] = ["Keyless entry and push-button start", "دخول ذكي وتشغيل بزر"];
const SUNROOF: [string, string] = ["Sunroof", "فتحة سقف"];
const LEATHER: [string, string] = ["Leather seats", "مقاعد جلد"];
const CLIMATE: [string, string] = ["Automatic climate control", "تكييف أوتوماتيكي"];
const ALLOYS: [string, string] = ["Alloy wheels", "عجلات من السبائك"];

export const MODELS: Record<ModelKey, ModelSpec> = {
  "elantra-cn7": {
    make: "Hyundai", model: "Elantra", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([CARPLAY, CAMERA, KEYLESS, CLIMATE, ALLOYS]),
    about: {
      en: "The seventh-generation Elantra (CN7): a 1.6 engine with a CVT, roomy rear seats and low running costs.",
      ar: "إلنترا الجيل السابع (CN7): محرك 1.6 مع ناقل حركة CVT، ومقاعد خلفية واسعة، وتكاليف تشغيل منخفضة.",
    },
  },
  "elantra-ad": {
    make: "Hyundai", model: "Elantra", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "Grey",
    features: f([CAMERA, SENSORS, CRUISE, ALLOYS]),
    about: {
      en: "The facelifted sixth-generation Elantra (AD): the 1.6 with a six-speed automatic, and parts at every workshop.",
      ar: "إلنترا الجيل السادس المحدّث (AD): محرك 1.6 مع ناقل أوتوماتيكي بست سرعات، وقطع غيار متوفرة في كل مكان.",
    },
  },
  "tucson-nx4": {
    make: "Hyundai", model: "Tucson", bodyType: "SUV", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "Grey",
    features: f([CARPLAY, CAMERA, KEYLESS, CLIMATE, SUNROOF, LEATHER]),
    about: {
      en: "The current Tucson (NX4): a quiet, well-equipped family SUV with a digital cluster and plenty of boot space.",
      ar: "توسان الجيل الحالي (NX4): سيارة عائلية هادئة ومجهزة جيدًا، بعدادات رقمية وصندوق أمتعة واسع.",
    },
  },
  "accent-rb": {
    make: "Hyundai", model: "Accent", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([SENSORS, ["Electric windows", "نوافذ كهربائية"]]),
    about: {
      en: "The Accent RB: simple, economical and easy to sell on — one of the most common cars on Egyptian roads.",
      ar: "أكسنت RB: سيارة بسيطة واقتصادية وسهلة البيع لاحقًا، ومن أكثر السيارات انتشارًا في مصر.",
    },
  },
  "sportage-ql": {
    make: "Kia", model: "Sportage", bodyType: "SUV", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "Silver",
    features: f([CAMERA, SENSORS, CRUISE, CLIMATE, ALLOYS]),
    about: {
      en: "The fourth-generation Sportage (QL): a comfortable compact SUV with a 1.6 engine and a six-speed automatic.",
      ar: "سبورتاج الجيل الرابع (QL): سيارة رياضية متعددة الاستخدامات مريحة، بمحرك 1.6 وناقل أوتوماتيكي بست سرعات.",
    },
  },
  "cerato-bd": {
    make: "Kia", model: "Cerato", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "Blue",
    features: f([CARPLAY, CAMERA, CRUISE, ALLOYS]),
    about: {
      en: "The Cerato BD: a sharp-looking 1.6 sedan with a generous boot and a well-laid-out cabin.",
      ar: "سيراتو BD: سيدان 1.6 بتصميم أنيق، وصندوق أمتعة كبير، ومقصورة مرتبة.",
    },
  },
  "picanto-ja": {
    make: "Kia", model: "Picanto", bodyType: "Hatchback", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([["Electric windows", "نوافذ كهربائية"], ["Bluetooth", "بلوتوث"]]),
    about: {
      en: "The Picanto JA: a small city car that parks anywhere and sips fuel.",
      ar: "بيكانتو JA: سيارة مدينة صغيرة يسهل ركنها في أي مكان، واستهلاكها للوقود منخفض جدًا.",
    },
  },
  "corolla-e210": {
    make: "Toyota", model: "Corolla", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([CAMERA, CRUISE, CLIMATE, ["Lane departure warning", "تحذير مغادرة المسار"]]),
    about: {
      en: "The twelfth-generation Corolla (E210): Toyota's reliability, a 1.6 with a CVT, and strong resale value.",
      ar: "كورولا الجيل الثاني عشر (E210): اعتمادية تويوتا، ومحرك 1.6 مع ناقل CVT، وقيمة إعادة بيع مرتفعة.",
    },
  },
  "fortuner-an160": {
    make: "Toyota", model: "Fortuner", bodyType: "SUV", fuelType: "Gasoline", transmission: "Automatic", seats: 7, color: "Black",
    features: f([["Four-wheel drive", "دفع رباعي"], ["Seven seats", "سبعة مقاعد"], CAMERA, CLIMATE, LEATHER]),
    about: {
      en: "The Fortuner: a body-on-frame seven-seater with four-wheel drive, at home on the road to the North Coast or Siwa.",
      ar: "فورتشنر: سيارة سبعة مقاعد بشاسيه منفصل ودفع رباعي، مناسبة لطريق الساحل الشمالي وللرحلات الصحراوية.",
    },
  },
  "sunny-n17": {
    make: "Nissan", model: "Sunny", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "Silver",
    features: f([["Electric windows", "نوافذ كهربائية"], ["Air conditioning", "تكييف"]]),
    about: {
      en: "The Nissan Sunny: a 1.5 family sedan, cheap to run and to service, with a big boot.",
      ar: "نيسان صني: سيدان عائلية بمحرك 1.5، صيانتها واستهلاكها اقتصاديان، وصندوقها واسع.",
    },
  },
  "qashqai-j11": {
    make: "Nissan", model: "Qashqai", bodyType: "SUV", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([["360-degree camera", "كاميرا 360 درجة"], CRUISE, CLIMATE, KEYLESS]),
    about: {
      en: "The facelifted Qashqai (J11): a 1.2 turbo crossover with a smooth CVT and a 360-degree camera.",
      ar: "قشقاي المحدّثة (J11): كروس أوفر بمحرك 1.2 تيربو، وناقل CVT سلس، وكاميرا 360 درجة.",
    },
  },
  "mg-zs": {
    make: "MG", model: "ZS", bodyType: "SUV", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([CARPLAY, CAMERA, CRUISE, SUNROOF]),
    about: {
      en: "The MG ZS: a roomy compact SUV for the price of a sedan, with a panoramic roof on higher trims.",
      ar: "MG ZS: سيارة رياضية مدمجة واسعة بسعر سيارة سيدان، مع سقف بانورامي في الفئات الأعلى.",
    },
  },
  tiggo7pro: {
    make: "Chery", model: "Tiggo 7 Pro", bodyType: "SUV", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "Red",
    features: f([["Twin 10-inch screens", "شاشتان مقاس 10 بوصات"], ["360-degree camera", "كاميرا 360 درجة"], LEATHER, SUNROOF, KEYLESS]),
    about: {
      en: "The Tiggo 7 Pro: a 1.5 turbo SUV assembled in Egypt, generously equipped for its price.",
      ar: "تيجو 7 برو: سيارة رياضية بمحرك 1.5 تيربو تُجمَّع في مصر، وتجهيزاتها سخية مقارنة بسعرها.",
    },
  },
  logan: {
    make: "Renault", model: "Logan", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Manual", seats: 5, color: "Navy Blue",
    features: f([["Air conditioning", "تكييف"], ["Power steering", "توجيه معزز"]]),
    about: {
      en: "The Renault Logan: a no-nonsense 1.6 sedan with a tough suspension and very cheap parts.",
      ar: "رينو لوجان: سيدان 1.6 عملية بتعليق متين وقطع غيار رخيصة جدًا.",
    },
  },
  "peugeot-3008": {
    make: "Peugeot", model: "3008", bodyType: "SUV", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([["Digital i-Cockpit", "عدادات رقمية i-Cockpit"], CARPLAY, CLIMATE, KEYLESS, ALLOYS]),
    about: {
      en: "The Peugeot 3008: a distinctive 1.6 turbo SUV with the i-Cockpit digital dashboard.",
      ar: "بيجو 3008: سيارة رياضية مميزة بمحرك 1.6 تيربو ولوحة قيادة رقمية i-Cockpit.",
    },
  },
  "c200-w205": {
    make: "Mercedes-Benz", model: "C 200", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([LEATHER, ["Ambient lighting", "إضاءة داخلية محيطية"], CAMERA, CLIMATE, KEYLESS]),
    about: {
      en: "The C-Class (W205): a 1.5 turbo with EQ Boost, the quiet comfort a Mercedes is bought for.",
      ar: "الفئة C (W205): محرك 1.5 تيربو مع EQ Boost، وراحة وهدوء من مرسيدس.",
    },
  },
  "bmw-g20": {
    make: "BMW", model: "320i", bodyType: "Sedan", fuelType: "Gasoline", transmission: "Automatic", seats: 5, color: "White",
    features: f([["Live Cockpit digital cluster", "عدادات رقمية Live Cockpit"], LEATHER, CAMERA, CLIMATE, ["Sport seats", "مقاعد رياضية"]]),
    about: {
      en: "The 3 Series (G20): a 2.0 turbo with an eight-speed automatic, the driver's choice in its class.",
      ar: "الفئة الثالثة (G20): محرك 2.0 تيربو مع ناقل أوتوماتيكي بثماني سرعات، والخيار الأمتع للقيادة في فئتها.",
    },
  },
};
