/**
 * Egypt's governorates and the cities a dealership can be in, with both
 * display names.
 *
 * This replaces three round-trips to api.countrystatecity.in during onboarding.
 * The product is Egypt-only, so fetching a worldwide country list behind an API
 * key — on the critical path of signing a dealer up, where an outage or a
 * lapsed key silently empties the dropdown — bought nothing.
 *
 * It is also the single source of truth for place names. The dropdown, the
 * display lookup and the search aliases all read this file, so a value that can
 * be chosen is always a value that can be translated: the coverage gap that
 * arises from keeping an option list and a message catalogue in separate places
 * cannot happen here.
 *
 * ## Why the names are curated rather than imported
 *
 * The API's Egyptian city list mixed governorate capitals with Cairo
 * neighbourhoods, listed districts twice ("Disūq" and "Markaz Disūq" are one
 * place), and transliterated inconsistently — "Al Manşūrah" beside "Mersa
 * Matruh". Matching those spellings to Arabic automatically produced confident
 * nonsense: Abu Qir matched Abusir, Heliopolis matched Hermopolis, and Rehab
 * matched Dahab, which is on the other side of the country. So the list below
 * is written out, using the spellings Egyptians actually write.
 *
 * ## What is stored
 *
 * `Organization.region` holds the governorate `code` and `Organization.city`
 * holds the city `slug`. Neither column holds a display name, so nothing has to
 * be re-spelled to be translated, and a dealer switching the site to Arabic
 * sees their own address change language.
 */

export interface EgyptCity {
  /** Stored in `Organization.city`. Stable; never re-generate these. */
  slug: string;
  en: string;
  ar: string;
}

export interface EgyptGovernorate {
  /** ISO 3166-2:EG subdivision code, stored in `Organization.region`. */
  code: string;
  en: string;
  ar: string;
  cities: readonly EgyptCity[];
}

const city = (slug: string, en: string, ar: string): EgyptCity => ({
  slug,
  en,
  ar,
});

export const EGYPT_COUNTRY_CODE = "EG";

export const EGYPT_GOVERNORATES: readonly EgyptGovernorate[] = [
  {
    code: "C",
    en: "Cairo",
    ar: "القاهرة",
    cities: [
      city("cairo", "Cairo", "القاهرة"),
      city("new-cairo", "New Cairo", "القاهرة الجديدة"),
      city("nasr-city", "Nasr City", "مدينة نصر"),
      city("heliopolis", "Heliopolis", "مصر الجديدة"),
      city("maadi", "Maadi", "المعادي"),
      city("zamalek", "Zamalek", "الزمالك"),
      city("shubra", "Shubra", "شبرا"),
      city("helwan", "Helwan", "حلوان"),
      city("el-rehab", "El Rehab", "الرحاب"),
      city("madinaty", "Madinaty", "مدينتي"),
      city("el-shorouk", "El Shorouk", "الشروق"),
      city("badr-city", "Badr City", "مدينة بدر"),
      city("el-matareya", "El Matareya", "المطرية"),
      city("ain-shams", "Ain Shams", "عين شمس"),
      city("el-marg", "El Marg", "المرج"),
      city("maasara", "El Maasara", "المعصرة"),
      city("tura", "Tura", "طرة"),
      city("downtown-cairo", "Downtown Cairo", "وسط البلد"),
      city("new-capital", "New Administrative Capital", "العاصمة الإدارية الجديدة"),
    ],
  },
  {
    code: "GZ",
    en: "Giza",
    ar: "الجيزة",
    cities: [
      city("giza", "Giza", "الجيزة"),
      city("6th-of-october", "6th of October City", "مدينة السادس من أكتوبر"),
      city("sheikh-zayed", "Sheikh Zayed City", "مدينة الشيخ زايد"),
      city("dokki", "Dokki", "الدقي"),
      city("mohandessin", "Mohandessin", "المهندسين"),
      city("haram", "Haram", "الهرم"),
      city("faisal", "Faisal", "فيصل"),
      city("imbaba", "Imbaba", "إمبابة"),
      city("agouza", "Agouza", "العجوزة"),
      city("hawamdeya", "El Hawamdeya", "الحوامدية"),
      city("badrashin", "El Badrashin", "البدرشين"),
      city("saff", "El Saff", "الصف"),
      city("atfih", "Atfih", "أطفيح"),
      city("ausim", "Ausim", "أوسيم"),
      city("kerdasa", "Kerdasa", "كرداسة"),
    ],
  },
  {
    code: "ALX",
    en: "Alexandria",
    ar: "الإسكندرية",
    cities: [
      city("alexandria", "Alexandria", "الإسكندرية"),
      city("borg-el-arab", "Borg El Arab", "برج العرب"),
      city("new-borg-el-arab", "New Borg El Arab", "برج العرب الجديدة"),
      city("abu-qir", "Abu Qir", "أبو قير"),
      city("montaza", "Montaza", "المنتزه"),
      city("sidi-bishr", "Sidi Bishr", "سيدي بشر"),
      city("el-raml", "El Raml", "الرمل"),
      city("agami", "Agami", "العجمي"),
      city("smouha", "Smouha", "سموحة"),
      city("miami", "Miami", "ميامي"),
    ],
  },
  {
    code: "KB",
    en: "Qalyubia",
    ar: "القليوبية",
    cities: [
      city("banha", "Banha", "بنها"),
      city("shubra-el-kheima", "Shubra El Kheima", "شبرا الخيمة"),
      city("qalyub", "Qalyub", "قليوب"),
      city("el-obour", "El Obour", "العبور"),
      city("khanka", "El Khanka", "الخانكة"),
      city("qanater-khayreya", "El Qanater El Khayreya", "القناطر الخيرية"),
      city("shibin-el-qanater", "Shibin El Qanater", "شبين القناطر"),
      city("kafr-shukr", "Kafr Shukr", "كفر شكر"),
      city("tukh", "Tukh", "طوخ"),
    ],
  },
  {
    code: "SHR",
    en: "Sharqia",
    ar: "الشرقية",
    cities: [
      city("zagazig", "Zagazig", "الزقازيق"),
      city("10th-of-ramadan", "10th of Ramadan City", "مدينة العاشر من رمضان"),
      city("bilbeis", "Bilbeis", "بلبيس"),
      city("abu-hammad", "Abu Hammad", "أبو حماد"),
      city("abu-kabir", "Abu Kabir", "أبو كبير"),
      city("faqous", "Faqous", "فاقوس"),
      city("hehia", "Hehia", "ههيا"),
      city("minya-el-qamh", "Minya El Qamh", "منيا القمح"),
      city("diyarb-negm", "Diyarb Negm", "ديرب نجم"),
      city("el-qurein", "El Qurein", "القرين"),
    ],
  },
  {
    code: "DK",
    en: "Dakahlia",
    ar: "الدقهلية",
    cities: [
      city("mansoura", "Mansoura", "المنصورة"),
      city("talkha", "Talkha", "طلخا"),
      city("mit-ghamr", "Mit Ghamr", "ميت غمر"),
      city("bilqas", "Bilqas", "بلقاس"),
      city("sherbin", "Sherbin", "شربين"),
      city("aga", "Aga", "أجا"),
      city("el-senbellawein", "El Senbellawein", "السنبلاوين"),
      city("el-manzala", "El Manzala", "المنزلة"),
      city("dekernes", "Dekernes", "دكرنس"),
      city("gamasa", "Gamasa", "جمصة"),
    ],
  },
  {
    code: "GH",
    en: "Gharbia",
    ar: "الغربية",
    cities: [
      city("tanta", "Tanta", "طنطا"),
      city("el-mahalla-el-kubra", "El Mahalla El Kubra", "المحلة الكبرى"),
      city("kafr-el-zayat", "Kafr El Zayat", "كفر الزيات"),
      city("zefta", "Zefta", "زفتى"),
      city("samannoud", "Samannoud", "سمنود"),
      city("basyoun", "Basyoun", "بسيون"),
      city("qutour", "Qutour", "قطور"),
      city("el-santa", "El Santa", "السنطة"),
    ],
  },
  {
    code: "MNF",
    en: "Monufia",
    ar: "المنوفية",
    cities: [
      city("shibin-el-kom", "Shibin El Kom", "شبين الكوم"),
      city("sadat-city", "Sadat City", "مدينة السادات"),
      city("menouf", "Menouf", "منوف"),
      city("ashmoun", "Ashmoun", "أشمون"),
      city("quweisna", "Quweisna", "قويسنا"),
      city("berket-el-sabee", "Berket El Sabe", "بركة السبع"),
      city("tala", "Tala", "تلا"),
      city("el-bagour", "El Bagour", "الباجور"),
    ],
  },
  {
    code: "BH",
    en: "Beheira",
    ar: "البحيرة",
    cities: [
      city("damanhur", "Damanhur", "دمنهور"),
      city("kafr-el-dawwar", "Kafr El Dawwar", "كفر الدوار"),
      city("rashid", "Rashid", "رشيد"),
      city("edku", "Edku", "إدكو"),
      city("abu-el-matamir", "Abu El Matamir", "أبو المطامير"),
      city("hosh-eissa", "Hosh Eissa", "حوش عيسى"),
      city("kom-hamada", "Kom Hamada", "كوم حمادة"),
      city("el-delengat", "El Delengat", "الدلنجات"),
      city("wadi-el-natrun", "Wadi El Natrun", "وادي النطرون"),
    ],
  },
  {
    code: "KFS",
    en: "Kafr El Sheikh",
    ar: "كفر الشيخ",
    cities: [
      city("kafr-el-sheikh", "Kafr El Sheikh", "كفر الشيخ"),
      city("desouk", "Desouk", "دسوق"),
      city("baltim", "Baltim", "بلطيم"),
      city("fuwwah", "Fuwwah", "فوه"),
      city("sidi-salem", "Sidi Salem", "سيدي سالم"),
      city("el-hamool", "El Hamool", "الحامول"),
      city("metoubes", "Metoubes", "مطوبس"),
    ],
  },
  {
    code: "DT",
    en: "Damietta",
    ar: "دمياط",
    cities: [
      city("damietta", "Damietta", "دمياط"),
      city("new-damietta", "New Damietta", "دمياط الجديدة"),
      city("ras-el-bar", "Ras El Bar", "رأس البر"),
      city("faraskur", "Faraskur", "فارسكور"),
      city("kafr-saad", "Kafr Saad", "كفر سعد"),
      city("ezbet-el-borg", "Ezbet El Borg", "عزبة البرج"),
    ],
  },
  {
    code: "PTS",
    en: "Port Said",
    ar: "بورسعيد",
    cities: [
      city("port-said", "Port Said", "بورسعيد"),
      city("port-fouad", "Port Fouad", "بورفؤاد"),
    ],
  },
  {
    code: "IS",
    en: "Ismailia",
    ar: "الإسماعيلية",
    cities: [
      city("ismailia", "Ismailia", "الإسماعيلية"),
      city("fayed", "Fayed", "فايد"),
      city("el-qantara", "El Qantara", "القنطرة"),
      city("abu-suwir", "Abu Suwir", "أبو صوير"),
      city("el-tal-el-kebir", "El Tal El Kebir", "التل الكبير"),
    ],
  },
  {
    code: "SUZ",
    en: "Suez",
    ar: "السويس",
    cities: [
      city("suez", "Suez", "السويس"),
      city("ain-sokhna", "Ain Sokhna", "العين السخنة"),
      city("ataqa", "Ataqa", "عتاقة"),
    ],
  },
  {
    code: "SIN",
    en: "North Sinai",
    ar: "شمال سيناء",
    cities: [
      city("arish", "Arish", "العريش"),
      city("bir-el-abd", "Bir El Abd", "بئر العبد"),
      city("sheikh-zuweid", "Sheikh Zuweid", "الشيخ زويد"),
    ],
  },
  {
    code: "JS",
    en: "South Sinai",
    ar: "جنوب سيناء",
    cities: [
      city("sharm-el-sheikh", "Sharm El Sheikh", "شرم الشيخ"),
      city("dahab", "Dahab", "دهب"),
      city("nuweiba", "Nuweiba", "نويبع"),
      city("el-tor", "El Tor", "الطور"),
      city("saint-catherine", "Saint Catherine", "سانت كاترين"),
      city("taba", "Taba", "طابا"),
      city("ras-sedr", "Ras Sedr", "رأس سدر"),
    ],
  },
  {
    code: "BA",
    en: "Red Sea",
    ar: "البحر الأحمر",
    cities: [
      city("hurghada", "Hurghada", "الغردقة"),
      city("el-gouna", "El Gouna", "الجونة"),
      city("safaga", "Safaga", "سفاجا"),
      city("marsa-alam", "Marsa Alam", "مرسى علم"),
      city("el-quseir", "El Quseir", "القصير"),
      city("ras-ghareb", "Ras Ghareb", "رأس غارب"),
    ],
  },
  {
    code: "MT",
    en: "Matrouh",
    ar: "مطروح",
    cities: [
      city("marsa-matrouh", "Marsa Matrouh", "مرسى مطروح"),
      city("el-alamein", "El Alamein", "العلمين"),
      city("new-alamein", "New Alamein", "العلمين الجديدة"),
      city("siwa", "Siwa", "سيوة"),
      city("el-dabaa", "El Dabaa", "الضبعة"),
      city("sidi-abdel-rahman", "Sidi Abdel Rahman", "سيدي عبد الرحمن"),
    ],
  },
  {
    code: "FYM",
    en: "Faiyum",
    ar: "الفيوم",
    cities: [
      city("faiyum", "Faiyum", "الفيوم"),
      city("sinnuris", "Sinnuris", "سنورس"),
      city("ibsheway", "Ibsheway", "إبشواي"),
      city("tamiya", "Tamiya", "طامية"),
      city("el-wasta", "El Wasta", "الواسطى"),
    ],
  },
  {
    code: "BNS",
    en: "Beni Suef",
    ar: "بني سويف",
    cities: [
      city("beni-suef", "Beni Suef", "بني سويف"),
      city("new-beni-suef", "New Beni Suef", "بني سويف الجديدة"),
      city("el-wasta-bns", "El Wasta", "الواسطى"),
      city("nasser", "Nasser", "ناصر"),
      city("biba", "Biba", "ببا"),
      city("el-fashn", "El Fashn", "الفشن"),
    ],
  },
  {
    code: "MN",
    en: "Minya",
    ar: "المنيا",
    cities: [
      city("minya", "Minya", "المنيا"),
      city("new-minya", "New Minya", "المنيا الجديدة"),
      city("mallawi", "Mallawi", "ملوي"),
      city("beni-mazar", "Beni Mazar", "بني مزار"),
      city("samalut", "Samalut", "سمالوط"),
      city("maghagha", "Maghagha", "مغاغة"),
      city("matay", "Matay", "مطاي"),
      city("abu-qurqas", "Abu Qurqas", "أبو قرقاص"),
      city("deir-mawas", "Deir Mawas", "دير مواس"),
    ],
  },
  {
    code: "AST",
    en: "Asyut",
    ar: "أسيوط",
    cities: [
      city("asyut", "Asyut", "أسيوط"),
      city("new-asyut", "New Asyut", "أسيوط الجديدة"),
      city("abnub", "Abnub", "أبنوب"),
      city("abu-tig", "Abu Tig", "أبو تيج"),
      city("dayrut", "Dayrut", "ديروط"),
      city("manfalut", "Manfalut", "منفلوط"),
      city("el-qusiya", "El Qusiya", "القوصية"),
      city("el-badari", "El Badari", "البداري"),
    ],
  },
  {
    code: "SHG",
    en: "Sohag",
    ar: "سوهاج",
    cities: [
      city("sohag", "Sohag", "سوهاج"),
      city("new-sohag", "New Sohag", "سوهاج الجديدة"),
      city("akhmim", "Akhmim", "أخميم"),
      city("girga", "Girga", "جرجا"),
      city("tahta", "Tahta", "طهطا"),
      city("el-balyana", "El Balyana", "البلينا"),
      city("tima", "Tima", "طما"),
      city("el-maragha", "El Maragha", "المراغة"),
    ],
  },
  {
    code: "KN",
    en: "Qena",
    ar: "قنا",
    cities: [
      city("qena", "Qena", "قنا"),
      city("nag-hammadi", "Nag Hammadi", "نجع حمادي"),
      city("qus", "Qus", "قوص"),
      city("dishna", "Dishna", "دشنا"),
      city("farshut", "Farshut", "فرشوط"),
      city("qift", "Qift", "قفط"),
    ],
  },
  {
    code: "LX",
    en: "Luxor",
    ar: "الأقصر",
    cities: [
      city("luxor", "Luxor", "الأقصر"),
      city("esna", "Esna", "إسنا"),
      city("armant", "Armant", "أرمنت"),
      city("el-tod", "El Tod", "الطود"),
    ],
  },
  {
    code: "ASN",
    en: "Aswan",
    ar: "أسوان",
    cities: [
      city("aswan", "Aswan", "أسوان"),
      city("kom-ombo", "Kom Ombo", "كوم أمبو"),
      city("edfu", "Edfu", "إدفو"),
      city("abu-simbel", "Abu Simbel", "أبو سمبل"),
      city("daraw", "Daraw", "دراو"),
    ],
  },
  {
    code: "WAD",
    en: "New Valley",
    ar: "الوادي الجديد",
    cities: [
      city("kharga", "Kharga", "الخارجة"),
      city("dakhla", "Dakhla", "الداخلة"),
      city("farafra", "Farafra", "الفرافرة"),
      city("balat", "Balat", "بلاط"),
    ],
  },
] as const;

/** Every city, flattened, with the governorate it belongs to. */
export const EGYPT_CITIES: readonly (EgyptCity & { governorate: string })[] =
  EGYPT_GOVERNORATES.flatMap((governorate) =>
    governorate.cities.map((entry) => ({
      ...entry,
      governorate: governorate.code,
    }))
  );

const GOVERNORATES_BY_CODE = new Map(
  EGYPT_GOVERNORATES.map((governorate) => [governorate.code, governorate])
);

const CITIES_BY_SLUG = new Map(EGYPT_CITIES.map((entry) => [entry.slug, entry]));

export function findGovernorate(code?: string | null) {
  return code ? GOVERNORATES_BY_CODE.get(code) : undefined;
}

export function findCity(slug?: string | null) {
  return slug ? CITIES_BY_SLUG.get(slug) : undefined;
}
