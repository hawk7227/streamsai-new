import { NextResponse } from "next/server";
import { createAssistantSuggestions } from "@/lib/openai/responses";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const prompt = typeof payload?.prompt === "string" ? payload.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const suggestions = await createAssistantSuggestions({
      prompt,
      generationType: payload?.generationType ?? "video",
      aspectRatio: payload?.aspectRatio,
      duration: payload?.duration,
      quality: payload?.quality,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Assistant failed",
      },
      { status: 500 }
    );
  }
}
