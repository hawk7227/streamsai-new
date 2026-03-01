const OPENAI_API_URL = "https://api.openai.com/v1/responses";

export type AssistantSuggestionType = "enhance" | "detail" | "style";

export interface AssistantSuggestion {
  type: AssistantSuggestionType;
  text: string;
}

interface AssistantRequest {
  prompt: string;
  generationType: string;
  aspectRatio?: string;
  duration?: string;
  quality?: string;
}

const buildAssistantSystemPrompt = ({
  generationType,
  aspectRatio,
  duration,
  quality,
}: AssistantRequest) => {
  const context = [
    `You are a helpful prompt assistant for ${generationType} generation.`,
    aspectRatio ? `Aspect ratio: ${aspectRatio}.` : null,
    duration ? `Duration: ${duration}.` : null,
    quality ? `Quality: ${quality}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return `${context} Return JSON only with keys "enhance", "detail", "style". Each value must be a short phrase that could be appended to the prompt.`;
};

const extractOutputText = (payload: Record<string, unknown>): string | null => {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  const output = payload?.output as Array<Record<string, unknown>> | undefined;
  const content = output?.[0]?.content;
  if (Array.isArray(content)) {
    const textBlock = content.find((block: Record<string, unknown>) => block.type === "output_text") as Record<string, unknown> | undefined;
    if (typeof textBlock?.text === "string") {
      return textBlock.text;
    }
  }

  return null;
};

export async function createAssistantSuggestions({
  prompt,
  generationType,
  aspectRatio,
  duration,
  quality,
}: AssistantRequest): Promise<AssistantSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: buildAssistantSystemPrompt({
                prompt,
                generationType,
                aspectRatio,
                duration,
                quality,
              }),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message ?? "OpenAI request failed");
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI response missing text output");
  }

  let parsed: { enhance?: string; detail?: string; style?: string } | null = null;

  try {
    parsed = JSON.parse(outputText);
  } catch {
    parsed = null;
  }

  if (!parsed?.enhance || !parsed?.detail || !parsed?.style) {
    throw new Error("OpenAI response did not include required fields");
  }

  return [
    { type: "enhance", text: parsed.enhance },
    { type: "detail", text: parsed.detail },
    { type: "style", text: parsed.style },
  ];
}
