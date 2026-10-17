import { z } from "zod";
import { refreshImageAlts } from "@/lib/services/car/image-alts";
import { embedQuestion } from "@/lib/services/buyer-question/meaning";
import { embedCar } from "@/lib/services/car/embedding";
import { refreshSearchVocabulary } from "@/lib/services/car/search-vocabulary";

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
  "question-embedding": {
    schema: z.object({
      questionId: z.string().uuid(),
      organizationId: z.string().min(1),
    }),
    run: async ({ questionId, organizationId }: { questionId: string; organizationId: string }) => {
      await embedQuestion(questionId, organizationId);
    },
  },
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
