import { embedTexts } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import { logError } from "@/lib/utils/errors";

/** A search's text as a vector, and the model that made it — to compare with cars by the same model. */
export interface SearchMeaning {
  vector: number[];
  model: string;
}

/** A buyer is waiting on the results; meaning is worth this much of their time, no more. */
const WAIT_MS = 1_500;

/**
 * What a buyer's search text means, for ranking cars by meaning as well as by
 * its words. Null whenever it cannot be had in time — no key, the pool at its
 * cap, a slow model — and the search runs on its words alone, as before.
 * Repeated searches are answered from the response cache.
 */
export async function searchMeaning(search: string | undefined): Promise<SearchMeaning | null> {
  const text = search?.trim();
  if (!text) return null;
  try {
    const { model, vectors } = await embedTexts({
      feature: AI_FEATURES.carSearchQuery,
      texts: [text],
      task: "query",
      ctx: { organizationId: null, userId: null, priority: "low" },
      timeoutMs: WAIT_MS,
    });
    return { vector: vectors[0], model };
  } catch (error) {
    logError("Search meaning unavailable; ranking by words alone", error);
    return null;
  }
}
