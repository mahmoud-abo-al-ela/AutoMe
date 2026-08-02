// AI vendor adapter - the ONLY module that constructs the Gemini client.
import { GoogleGenAI } from "@google/genai";

let client;

/**
 * Whether a Gemini API key is configured. Callers use this to degrade
 * gracefully (fall back to non-AI behaviour) instead of throwing.
 */
export function isAiConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Lazily construct a singleton GoogleGenAI client. Returns null when no key is
 * configured, so callers can fall back rather than crash.
 *
 * Deliberately NOT constructed at module scope: the old call sites
 * (actions/cars.js, actions/home.js) built the client eagerly, so a missing key
 * became an import-time crash / a per-call re-construction. Here it's a lazy
 * singleton and a missing key is a runtime fallback.
 */
export function getGenAI() {
    if (!isAiConfigured()) return null;
    client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return client;
}
