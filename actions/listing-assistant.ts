"use server";
import { withErrorHandling } from "@/lib/middleware/with-auth";
import { enforceListingQuestionLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { listingAnswerRatingSchema, listingQuestionSchema } from "@/lib/validations/schemas";
import { askAboutListing, rateListingAnswer } from "@/lib/services/car/listing-assistant";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { createSuccessResponse } from "@/lib/utils/response";
import { classifyBuyerMessage } from "@/lib/utils/buyer-message";
import type { AssistantReply } from "@/lib/services/car/listing-assistant";
import { startTrace } from "@/lib/utils/dev-trace";

export const askListingAssistant = withErrorHandling(async (input: unknown) => {
  const { carId, question, locale, historyIds } = validateAction(listingQuestionSchema, input);
  // Dev-only: every step of this question, in the dev server's terminal.
  const trace = startTrace("assistant", `"${question}" (${locale}) · car ${carId.slice(0, 8)}`);

  // A greeting, a thank-you or a keyboard mash is answered here, before the
  // rate limit and the model: it costs the dealer nothing and the buyer no wait.
  const kind = classifyBuyerMessage(question);
  trace.step(`classify → ${kind}`);
  if (kind !== "question") {
    const reply: AssistantReply = { status: "smallTalk", kind };
    trace.end(`instant ${kind} reply — no AI call`);
    return createSuccessResponse(reply);
  }

  try {
    await enforceListingQuestionLimit(carId);
    trace.step("rate limit ✓ (per visitor and per car)");

    const organization = await getCurrentOrganization();
    const reply = await askAboutListing(carId, question, locale, organization?.id ?? null, {
      trace,
      historyIds,
    });
    return createSuccessResponse(reply);
  } catch (error) {
    trace.end(`failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
});

export const rateListingAssistantAnswer = withErrorHandling(async (input: unknown) => {
  const { answerId, helpful } = validateAction(listingAnswerRatingSchema, input);
  await rateListingAnswer(answerId, helpful);
  return createSuccessResponse({ rated: true });
});
