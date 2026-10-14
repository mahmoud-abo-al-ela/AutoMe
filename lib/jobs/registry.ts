import { z } from "zod";
import { refreshImageAlts } from "@/lib/services/car/image-alts";
import { embedQuestion } from "@/lib/services/buyer-question/meaning";
import { embedCar } from "@/lib/services/car/embedding";
import { refreshSearchVocabulary } from "@/lib/services/car/search-vocabulary";

/**
 * Every background job: the shape of its payload and what running it does.
 * A job must be safe to run twice — the queue delivers at least once, and a
 * retry follows any failure — so each one re-reads its state and converges.
 *
 * A job throws to be retried. Payloads are signed by the queue (see
 * app/api/jobs/[name]/route.ts) and validated again here, so a job trusts
 * nothing a request could have shaped.
 */

const callerSchema = z.object({
  organizationId: z.string().nullable(),
  userId: z.string().nullable(),
  priority: z.enum(["standard", "low"]).optional(),
});

export const JOBS = {
  /**
   * Describe a car's new photos and drop descriptions of removed ones.
   * Idempotent: it describes only what is undescribed, scoped to the tenant.
   */
  "image-alts": {
    schema: z.object({
      carId: z.string().uuid(),
      organizationId: z.string().min(1),
      caller: callerSchema,
    }),
    run: ({ carId, organizationId, caller }: { carId: string; organizationId: string; caller: z.infer<typeof callerSchema> }) =>
      refreshImageAlts(carId, organizationId, caller, { rethrow: true }),
  },
  /**
   * Give a car its meaning for search after a save. Idempotent: skips a car
   * whose text and embedding model have not changed since its last vector.
   */
  "car-embedding": {
    schema: z.object({
      carId: z.string().uuid(),
      organizationId: z.string().min(1),
    }),
    run: async ({ carId, organizationId }: { carId: string; organizationId: string }) => {
      await embedCar(carId, organizationId);
    },
  },
  /**
   * Give a declined buyer question its meaning (a vector), folding it into
   * the earlier question it repeats on the same car. Idempotent: skips a
   * question already embedded by the current model, or gone.
   */
  "question-embedding": {
    schema: z.object({
      questionId: z.string().uuid(),
      organizationId: z.string().min(1),
    }),
    run: async ({ questionId, organizationId }: { questionId: string; organizationId: string }) => {
      await embedQuestion(questionId, organizationId);
    },
  },
  /**
   * Rebuild the search's vocabulary after cars or dealerships change, at most
   * once per window (lib/jobs/search-terms.ts). Idempotent: it recomputes
   * everything from the cars listed when it runs.
   */
  "search-terms": {
    schema: z.object({}),
    run: async () => {
      await refreshSearchVocabulary();
    },
  },
} as const;

export type JobName = keyof typeof JOBS;
export type JobPayload<N extends JobName> = z.infer<(typeof JOBS)[N]["schema"]>;

export function isJobName(value: string): value is JobName {
  return Object.prototype.hasOwnProperty.call(JOBS, value);
}

/**
 * Whether a payload is one this job accepts. A payload that fails will fail
 * the same way on every delivery, so the route tells the queue not to retry
 * it rather than spending three more deliveries on it.
 */
export function isValidJobPayload(name: JobName, payload: unknown): boolean {
  return JOBS[name].schema.safeParse(payload).success;
}

/** Validate and run one job. Throws on a bad payload or a failed run. */
export async function runJob<N extends JobName>(name: N, payload: unknown): Promise<void> {
  // Each entry's run takes its own schema's output; TypeScript cannot see
  // that through the union of entries, so it is said once, here.
  const job = JOBS[name] as unknown as {
    schema: { parse(value: unknown): JobPayload<N> };
    run(payload: JobPayload<N>): Promise<unknown>;
  };
  await job.run(job.schema.parse(payload));
}
