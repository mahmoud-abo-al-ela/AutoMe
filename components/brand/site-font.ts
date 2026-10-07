import { Alexandria } from "next/font/google";

/**
 * The site's face. Drawn by Egyptian type designer Mohamed Gaber with Arabic
 * and Latin in one family, so a mixed title ("Kia Cerato ٢٠١٩") sits on one
 * baseline at one weight — no per-script fallback to tune. Variable, so Black
 * (display) through Regular (body) is one file.
 *
 * Loaded by the layouts that use it — the public site and the dealer
 * dashboard — rather than the locale layout, so the super-admin doesn't pay
 * for it. globals.css names the family directly, for the reason documented
 * on --font-sans there; applying `.variable` is what emits the @font-face.
 */
export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});
