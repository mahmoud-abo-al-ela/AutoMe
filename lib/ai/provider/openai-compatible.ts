import type { TokenUsage } from "@/lib/ai/models";
import type {
  AiPart,
  AiProvider,
  ProviderRequest,
  ProviderResult,
} from "@/lib/ai/provider/types";

/**
 * Any API speaking OpenAI's Chat Completions format — which most gateways and
 * vendors do. One implementation, configured per provider in lib/ai/providers:
 * a base URL and how it spells "think less". The key arrives per call.
 *
 * Plain `fetch`, no SDK: the surface used is one endpoint, and an SDK per
 * vendor is exactly the coupling this layer exists to avoid.
 */

export interface OpenAiCompatibleConfig {
  baseUrl: string;
  /**
   * The `reasoning_effort` sent for `thinking: "low"`, or undefined to send
   * nothing. Measured on CodeCraft: "low" changed nothing on Gemini 3.7 Flash,
   * "minimal" cut its completion tokens by a third.
   */
  lowReasoningEffort?: string;
}

interface ChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
}

interface ChatChunk {
  choices?: { delta?: { content?: string | null }; message?: { content?: string | null } }[];
  usage?: ChatUsage | null;
}

function toContent(parts: AiPart[]) {
  return parts.map((part) =>
    "text" in part
      ? { type: "text", text: part.text }
      : {
          type: "image_url",
          image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` },
        }
  );
}

/**
 * Reasoning tokens are reported inside completion_tokens; split them out so
 * the ledger's outputTokens/thinkingTokens mean the same for every provider.
 */
function usageOf(usage: ChatUsage | null | undefined): TokenUsage {
  const completion = usage?.completion_tokens ?? 0;
  const reasoning = Math.min(usage?.completion_tokens_details?.reasoning_tokens ?? 0, completion);
  return {
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: completion - reasoning,
    thinkingTokens: reasoning,
    cachedTokens: usage?.prompt_tokens_details?.cached_tokens ?? 0,
  };
}

/**
 * An HTTP failure as the shared classification expects it: a numeric status,
 * and a message short enough to log. The body is truncated because a gateway
 * may echo the request, and the request carries a buyer's words or a photo.
 */
async function httpError(response: Response): Promise<Error> {
  let detail = "";
  try {
    detail = (await response.text()).slice(0, 300);
  } catch {
    // The status alone is enough to classify.
  }
  return Object.assign(new Error(`HTTP ${response.status}: ${detail}`), {
    status: response.status,
  });
}

/** Read an SSE stream, calling onText with the running text. */
async function readStream(
  body: ReadableStream<Uint8Array>,
  onText: (textSoFar: string) => void
): Promise<ProviderResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let usage: ChatUsage | null | undefined;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue;

      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      let chunk: ChatChunk;
      try {
        chunk = JSON.parse(data);
      } catch {
        continue; // A keep-alive or a vendor extension line; not ours to fail on.
      }
      if (chunk.usage) usage = chunk.usage;
      const piece = chunk.choices?.[0]?.delta?.content;
      if (piece) {
        text += piece;
        onText(text);
      }
    }
  }

  return { text: text || undefined, usage: usageOf(usage) };
}

export function createOpenAiCompatibleProvider(config: OpenAiCompatibleConfig): AiProvider {
  return {
    async generate(req: ProviderRequest, apiKey: string): Promise<ProviderResult> {
      const streaming = Boolean(req.onText);
      const effort = req.thinking === "low" ? config.lowReasoningEffort : undefined;

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: req.model,
          messages: [{ role: "user", content: toContent(req.parts) }],
          temperature: req.temperature ?? 0.2,
          ...(req.maxOutputTokens ? { max_tokens: req.maxOutputTokens } : {}),
          ...(effort ? { reasoning_effort: effort } : {}),
          // Not strict: OpenAI's strict mode demands every property be required
          // and closed, which a Zod-derived schema does not guarantee. The Zod
          // parse upstream is the real contract either way.
          ...(req.responseJsonSchema
            ? {
                response_format: {
                  type: "json_schema",
                  json_schema: { name: "reply", strict: false, schema: req.responseJsonSchema },
                },
              }
            : {}),
          ...(streaming ? { stream: true, stream_options: { include_usage: true } } : {}),
        }),
        signal: req.signal,
      });

      if (!response.ok) throw await httpError(response);

      if (streaming && response.body) {
        return readStream(response.body, req.onText!);
      }

      const json = (await response.json()) as ChatChunk;
      return {
        text: json.choices?.[0]?.message?.content ?? undefined,
        usage: usageOf(json.usage),
      };
    },
  };
}
