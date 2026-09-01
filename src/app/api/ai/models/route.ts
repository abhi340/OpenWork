import { NextRequest, NextResponse } from "next/server";
import { validateAIEndpoint } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") || "ollama";
    const rawUrl = searchParams.get("baseUrl") || "";
    const apiKey = searchParams.get("apiKey") || "";

    // 1. Ollama provider
    if (provider === "ollama") {
      const targetUrl = rawUrl || "http://127.0.0.1:11434";
      const validation = validateAIEndpoint(targetUrl, "ollama");
      if (!validation.isValid || !validation.cleanUrl) {
        return NextResponse.json({ error: validation.error || "Invalid Ollama URL." }, { status: 400 });
      }

      const res = await fetch(`${validation.cleanUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Failed to reach Ollama." }, { status: res.status });
      }

      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name);
      return NextResponse.json({ models });
    }

    // 2. OpenAI-compatible Cloud Providers (OpenAI, Groq, OpenRouter, NVIDIA NIM, Custom)
    if (provider === "openai" || provider === "groq" || provider === "openrouter" || provider === "nvidia" || provider === "custom") {
      let defaultEndpoint = "https://api.openai.com/v1";
      if (provider === "groq") defaultEndpoint = "https://api.groq.com/openai/v1";
      if (provider === "openrouter") defaultEndpoint = "https://openrouter.ai/api/v1";
      if (provider === "nvidia") defaultEndpoint = "https://integrate.api.nvidia.com/v1";

      const targetUrl = rawUrl || defaultEndpoint;
      const validation = validateAIEndpoint(targetUrl, provider);

      if (!validation.isValid || !validation.cleanUrl) {
        return NextResponse.json({ error: validation.error || "Invalid endpoint URL." }, { status: 400 });
      }

      // Use user key or fall back to server env variables
      let effectiveApiKey = apiKey;
      if (!effectiveApiKey) {
        if (provider === "nvidia") effectiveApiKey = process.env.NVIDIA_API_KEY || "";
        if (provider === "groq") effectiveApiKey = process.env.GROQ_API_KEY || "";
        if (provider === "openai") effectiveApiKey = process.env.OPENAI_API_KEY || "";
        if (provider === "openrouter") effectiveApiKey = process.env.OPENROUTER_API_KEY || "";
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (effectiveApiKey) {
        headers["Authorization"] = `Bearer ${effectiveApiKey}`;
      }

      const res = await fetch(`${validation.cleanUrl}/models`, {
        method: "GET",
        headers
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: "Failed to fetch models" } }));
        return NextResponse.json(
          { error: err.detail || err.error?.message || err.message || `HTTP ${res.status}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      let rawList: any[] = data.data || data.models || [];
      
      // Keywords for non-chat/specialized models to filter out
      const nonChatKeywords = [
        "embed", "embedding", "reward", "safety", "guard",
        "detector", "translate", "calibration", "clip",
        "parse", "whisper", "tts", "stt", "dall-e", "bge",
        "rerank", "moderation", "transcription"
      ];

      // Filter & map model IDs to chat/instruct models only
      let models = rawList
        .map((m: any) => (typeof m === "string" ? m : m.id))
        .filter(Boolean)
        .filter((id: string) => {
          const lower = id.toLowerCase();
          return !nonChatKeywords.some((kw) => lower.includes(kw));
        });

      // Sort models logically
      models.sort((a, b) => a.localeCompare(b));

      // For NVIDIA NIM, surface confirmed flagship active models at the very top
      if (provider === "nvidia") {
        const verifiedActive = [
          "nvidia/llama-3.1-nemotron-70b-instruct",
          "meta/llama-3.2-11b-vision-instruct",
          "mistralai/mistral-large-2-instruct",
          "google/gemma-3-12b-it",
          "deepseek-ai/deepseek-v4-flash-0731"
        ];
        const confirmedInList = verifiedActive.filter((v) => models.includes(v));
        const remaining = models.filter((m) => !verifiedActive.includes(m));
        models = [...confirmedInList, ...remaining];
      }

      return NextResponse.json({ models });
    }

    // 3. Google Gemini
    if (provider === "gemini") {
      const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || "";
      if (!effectiveApiKey) {
        return NextResponse.json({ error: "Missing Gemini API key to list models." }, { status: 400 });
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(effectiveApiKey)}`,
        { method: "GET" }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: "Failed to fetch Gemini models" } }));
        return NextResponse.json({ error: err.error?.message || `HTTP ${res.status}` }, { status: res.status });
      }

      const data = await res.json();
      const models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace(/^models\//, ""));

      return NextResponse.json({ models });
    }

    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Could not fetch models" }, { status: 500 });
  }
}
