"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

/**
 * The last resort: the root layout itself failed, so this replaces the whole
 * document — no stylesheet, no fonts, no message files. Everything it needs
 * is here: the brand's colours inline, the barrier drawn in plain CSS, and the
 * copy in both languages, chosen from the address (/ar/… reads Arabic).
 */
const COPY = {
  en: {
    title: "Something went wrong",
    body: "AutoMe couldn’t load just now. Nothing you saved is lost. Try again in a moment.",
    retry: "Try again",
    reference: "If it keeps happening, quote this reference:",
  },
  ar: {
    title: "حدث خطأ ما",
    body: "تعذّر تحميل أوتومي الآن. لم يضِع شيء مما حفظته. حاول مرة أخرى بعد قليل.",
    retry: "حاول مرة أخرى",
    reference: "إن تكرر الخطأ، اذكر هذا الرقم المرجعي:",
  },
} as const;

const ASPHALT = "#17181b";
const MARKER = "#ffc629";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<"en" | "ar">("en");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // Read after mount: the server render has no window, and the two must match.
  useEffect(() => {
    if (window.location.pathname.startsWith("/ar")) setLocale("ar");
  }, []);

  const copy = COPY[locale];

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1ebe0",
          color: ASPHALT,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <main style={{ maxWidth: 520, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <span aria-hidden style={{ position: "relative", display: "block", width: 224, height: 96 }}>
            <span
              style={{
                position: "absolute",
                insetInline: 0,
                top: 0,
                height: 40,
                borderRadius: 6,
                border: `2px solid ${ASPHALT}`,
                boxShadow: `0 3px 0 ${ASPHALT}`,
                background: `repeating-linear-gradient(-45deg, ${MARKER} 0 16px, ${ASPHALT} 16px 32px)`,
              }}
            />
            <span style={{ position: "absolute", insetInlineStart: 28, top: 40, height: 48, width: 10, background: ASPHALT }} />
            <span style={{ position: "absolute", insetInlineEnd: 28, top: 40, height: 48, width: 10, background: ASPHALT }} />
            <span style={{ position: "absolute", bottom: 0, insetInlineStart: 12, height: 8, width: 40, borderRadius: 4, background: ASPHALT }} />
            <span style={{ position: "absolute", bottom: 0, insetInlineEnd: 12, height: 8, width: 40, borderRadius: 4, background: ASPHALT }} />
          </span>
          <span aria-hidden style={{ display: "block", width: 192, height: 6, borderRadius: 3, background: `repeating-linear-gradient(to right, ${MARKER} 0 32px, transparent 32px 46px)` }} />
          <h1 style={{ margin: "8px 0 0", fontSize: 36, fontWeight: 800, lineHeight: 1.15 }}>{copy.title}</h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#5c5549", maxWidth: "48ch" }}>{copy.body}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 8,
              height: 48,
              padding: "0 24px",
              borderRadius: 12,
              border: `2px solid ${ASPHALT}`,
              background: MARKER,
              color: ASPHALT,
              boxShadow: `0 3px 0 ${ASPHALT}`,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {copy.retry}
          </button>
          {error.digest && (
            <p style={{ margin: 0, fontSize: 12, color: "#5c5549" }}>
              {copy.reference} <bdi>{error.digest}</bdi>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
