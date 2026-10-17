import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { mainOrigin } from "@/lib/utils/seo-meta";

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

/** Read from the project root, where the build runs. */
const projectFile = (path: string) => readFile(join(process.cwd(), path));

const dataUri = async (path: string, type: string) =>
  `data:${type};base64,${(await projectFile(join("public", path))).toString("base64")}`;

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

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = (routing.locales.includes(locale as Locale) ? locale : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: "home.hero" });
  const [font, logo, photo] = await Promise.all([
    projectFile("assets/fonts/Cairo-ExtraBold.ttf"),
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
          // Always a string: ImageResponse throws on fontFamily: undefined.
          fontFamily: "Cairo",
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
          <span style={{ fontSize: 26, color: MUTED }}>{new URL(mainOrigin()).host}</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only */}
        <img src={photo} width={540} height={630} alt="" style={{ objectFit: "cover" }} />
      </div>
    ),
    { ...size, fonts: [{ name: "Cairo", data: font, weight: 800, style: "normal" }] }
  );
}
