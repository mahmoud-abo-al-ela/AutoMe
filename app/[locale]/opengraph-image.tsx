import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { logError } from "@/lib/utils/errors";
import { mainOrigin } from "@/lib/utils/seo-meta";

/**
 * The share card for every page that has no image of its own — home, the
 * lists, FAQ, about. Car and dealership pages set theirs (the car's photo,
 * the dealership's logo), which take precedence. Built once per locale at
 * build time.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AutoMe";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const LIMESTONE = "#f1ebe0";
const ASPHALT = "#17181b";
const MUTED = "#5c5549";
const MARKER = "#ffc629";

/**
 * Cairo, the site's Arabic face (it covers Latin too), as TrueType — the
 * format ImageResponse reads; Google Fonts serves it to an old user agent.
 * Null if the download fails: the card then renders without the headline
 * rather than with boxes where the letters should be.
 */
async function cairo(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Cairo:wght@800", {
      headers: { "User-Agent": "Mozilla/4.0" },
    }).then((res) => res.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((res) => res.arrayBuffer());
  } catch (error) {
    logError("Share image font unavailable; rendering without the headline", error);
    return null;
  }
}

/**
 * One line of the headline, word by word. ImageResponse shapes Arabic letters
 * but lays words out left to right with no bidi, so an Arabic line comes out
 * with its words — and its trailing comma or full stop — in mirror order. The
 * words are placed in reading order here instead, each with its punctuation
 * on the side it trails on.
 */
function Line({ text, rtl, accent = false }: { text: string; rtl: boolean; accent?: boolean }) {
  const words = text.split(/\s+/).filter(Boolean).map((word) => {
    const [, core, mark] = word.match(/^(.*?)([.,،؛!؟]*)$/) ?? [word, word, ""];
    return { core, mark };
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: rtl ? "row-reverse" : "row",
        gap: 18,
        ...(accent && { background: MARKER, padding: "0 16px", borderRadius: 12 }),
      }}
    >
      {words.map(({ core, mark }, i) => (
        <div key={i} style={{ display: "flex", flexDirection: rtl ? "row-reverse" : "row" }}>
          <span>{core}</span>
          {mark && <span>{mark}</span>}
        </div>
      ))}
    </div>
  );
}

const dataUri = async (path: string, type: string) =>
  `data:${type};base64,${(await readFile(join(process.cwd(), "public", path))).toString("base64")}`;

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (routing.locales.includes(locale as Locale) ? locale : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: "home.hero" });
  const [font, logo, photo] = await Promise.all([
    cairo(),
    dataUri("brand/autome-logo.png", "image/png"),
    dataUri("hero-car.jpg", "image/jpeg"),
  ]);
  const rtl = typedLocale === "ar";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: rtl ? "row-reverse" : "row",
          width: "100%",
          height: "100%",
          background: LIMESTONE,
          fontFamily: font ? "Cairo" : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: rtl ? "flex-end" : "flex-start",
            width: 660,
            padding: "64px 56px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only */}
          <img src={logo} width={260} height={121} alt="" />
          {font && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: rtl ? "flex-end" : "flex-start",
                gap: 4,
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.2,
                color: ASPHALT,
              }}
            >
              <Line text={t("titleLead")} rtl={rtl} />
              <Line text={t("titleTrustLead")} rtl={rtl} />
              <Line text={t("titleTrustAccent")} rtl={rtl} accent />
            </div>
          )}
          <span style={{ fontSize: 26, color: MUTED }}>{new URL(mainOrigin()).host}</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only */}
        <img src={photo} width={540} height={630} alt="" style={{ objectFit: "cover" }} />
      </div>
    ),
    {
      ...size,
      ...(font && { fonts: [{ name: "Cairo", data: font, weight: 800 as const, style: "normal" as const }] }),
    }
  );
}
