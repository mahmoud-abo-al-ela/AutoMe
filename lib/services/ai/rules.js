// Rules pre-filter: resolve simple queries WITHOUT an AI call, so we spend zero
// free-tier requests on phrasings we already understand.
import { emptyFilters, envelope } from "./normalize";
import { PHRASE_RULES, ENUM_WORDS, STOPWORDS, addEnum } from "./rules-data";

/**
 * Try to resolve `rawQuery` from known phrases/enums alone.
 *
 * Returns a filters envelope (high confidence) when EVERY meaningful word maps,
 * or null when the query needs the model. Deliberately conservative: any digit
 * (a price / year / mileage range) or any leftover unknown word defers to the
 * model, which has better judgment for nuance and conflicting hints.
 */
export function applyRules(rawQuery) {
    const q = ` ${String(rawQuery).toLowerCase().trim()} `;
    if (/\d/.test(q)) return null; // ranges / years / prices -> model

    const filters = emptyFilters();
    let remaining = q;
    let matched = false;

    for (const { re, apply } of PHRASE_RULES) {
        if (re.test(remaining)) {
            apply(filters);
            remaining = remaining.replace(new RegExp(re.source, "gi"), " ");
            matched = true;
        }
    }

    const leftover = [];
    for (const token of remaining.split(/[\s,]+/).filter(Boolean)) {
        const hit = ENUM_WORDS[token];
        if (hit) {
            addEnum(filters, hit.field, [hit.value]);
            matched = true;
        } else if (!STOPWORDS.has(token)) {
            leftover.push(token); // unknown meaningful word -> defer to the model
        }
    }

    if (!matched || leftover.length > 0) return null;
    return envelope(filters, { interpretation: "", unmapped: [], confidence: 0.9 });
}
