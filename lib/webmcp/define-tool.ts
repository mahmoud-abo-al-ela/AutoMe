import type { z } from "zod";
import { toJsonSchema } from "@/lib/utils/json-schema";
import { NotFoundError, ValidationError, logError } from "@/lib/utils/errors";
import type { JsonSchemaObject, WebMcpAnnotations, WebMcpToolDescriptor } from "./types";

/**
 * One WebMCP tool as AutoMe writes it: a Zod schema for its input and a plain
 * function for its work. toDescriptor turns it into what the browser takes —
 * the schema as JSON Schema, and an `execute` that refuses input outside the
 * schema before the work (and so before any change to the page) begins.
 *
 * A tool is a way for an agent to use the page the person is on, with the
 * same state the person sees: its work calls the page's own hooks and server
 * actions, so every rule stays on the server. Registering a tool grants
 * nothing the page did not already allow.
 */
export interface WebMcpToolDefinition<Input extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Lower snake case, ≤ 30 characters. */
  name: string;
  /** What it does and when to use it, ≤ 500 characters. */
  description: string;
  input: Input;
  annotations?: WebMcpAnnotations;
  run: (input: z.output<Input>, options: { signal?: AbortSignal }) => Promise<unknown>;
}

/**
 * A tool as a page's list of tools holds it, whatever its input. Safe to
 * widen: toDescriptor parses the input with the tool's own schema before
 * `run` ever sees it.
 */
export function defineWebMcpTool<Input extends z.ZodTypeAny>(definition: WebMcpToolDefinition<Input>): WebMcpToolDefinition {
  return definition as unknown as WebMcpToolDefinition;
}

/** Chrome's guidance for what an agent reads well (secure-tools, 2026-09). */
export const WEBMCP_BUDGETS = { name: 30, description: 500, parameterDescription: 150, output: 1_500 } as const;

/** What an agent is told when a call fails: a code, and for bad input, which field. */
export type WebMcpErrorCode = "invalid_input" | "not_found" | "failed";

const failure = (error: WebMcpErrorCode, extra: Record<string, unknown> = {}) => JSON.stringify({ error, ...extra });

export function inputSchemaOf(input: z.ZodTypeAny): JsonSchemaObject {
  return toJsonSchema(input) as JsonSchemaObject;
}

/** Arguments as Chrome passes them: an object, or (deprecated from 155) a JSON string. */
function argumentsOf(args: unknown): unknown {
  if (typeof args !== "string") return args ?? {};
  try {
    return JSON.parse(args);
  } catch {
    return undefined;
  }
}

export function toDescriptor<Input extends z.ZodTypeAny>(definition: WebMcpToolDefinition<Input>): WebMcpToolDescriptor {
  return {
    name: definition.name,
    description: definition.description,
    inputSchema: inputSchemaOf(definition.input),
    ...(definition.annotations && { annotations: definition.annotations }),
    execute: async (args, options) => {
      const parsed = definition.input.safeParse(argumentsOf(args));
      if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
        return failure("invalid_input", { issues });
      }
      try {
        const result = await definition.run(parsed.data, options ?? {});
        return typeof result === "string" ? result : JSON.stringify(result);
      } catch (error) {
        if (error instanceof ValidationError) return failure("invalid_input");
        if (error instanceof NotFoundError) return failure("not_found");
        logError(`WebMCP tool ${definition.name} failed`, error);
        return failure("failed");
      }
    },
  };
}
