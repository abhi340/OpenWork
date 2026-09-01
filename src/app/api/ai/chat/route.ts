import { NextRequest, NextResponse } from "next/server";
import { validateAIEndpoint } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = "ollama", apiKey = "", baseUrl = "", model = "", messages = [] } = body;

    // 1. Local Ollama (100% Free & Private)
    if (provider === "ollama") {
      const rawUrl = baseUrl || "http://127.0.0.1:11434";
      const validation = validateAIEndpoint(rawUrl, "ollama");

      if (!validation.isValid || !validation.cleanUrl) {
        return NextResponse.json(
          { error: validation.error || "Invalid or unauthorized Ollama URL." },
          { status: 400 }
        );
      }

      const targetModel = model || "llama3";

      try {
        const res = await fetch(`${validation.cleanUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: targetModel,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
            stream: false
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          return NextResponse.json(
            { error: `Ollama error (${res.status}): ${errText || "Is Ollama running at " + validation.cleanUrl + "?"}` },
            { status: res.status }
          );
        }

        const data = await res.json();
        return NextResponse.json({
          reply: data.message?.content || "No response received from local Ollama."
        });
      } catch (ollamaErr: any) {
        return NextResponse.json(
          { error: `Could not connect to Local Ollama at ${validation.cleanUrl}. Make sure Ollama is installed and running ('ollama serve').` },
          { status: 502 }
        );
      }
    }

    // 2. OpenAI / Groq / OpenRouter / NVIDIA NIM / Custom (OpenAI Compatible)
    if (provider === "openai" || provider === "custom" || provider === "groq" || provider === "openrouter" || provider === "nvidia") {
      let defaultEndpoint = "https://api.openai.com/v1";
      if (provider === "groq") defaultEndpoint = "https://api.groq.com/openai/v1";
      if (provider === "openrouter") defaultEndpoint = "https://openrouter.ai/api/v1";
      if (provider === "nvidia") defaultEndpoint = "https://integrate.api.nvidia.com/v1";

      const isOllamaUrl = baseUrl && (baseUrl.includes("127.0.0.1") || baseUrl.includes("localhost") || baseUrl.includes("11434"));
      const targetUrl = (!baseUrl || (isOllamaUrl && provider !== "ollama")) ? defaultEndpoint : baseUrl;
      const validation = validateAIEndpoint(targetUrl, provider);

      if (!validation.isValid || !validation.cleanUrl) {
        return NextResponse.json(
          { error: validation.error || "Unauthorized or invalid endpoint URL." },
          { status: 400 }
        );
      }

      const endpoint = validation.cleanUrl;
      const targetModel = model || (provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

      // Use user-provided API key, or fall back to server environment variables (.env.local)
      let effectiveApiKey = apiKey;
      if (!effectiveApiKey) {
        if (provider === "nvidia") effectiveApiKey = process.env.NVIDIA_API_KEY || "";
        if (provider === "groq") effectiveApiKey = process.env.GROQ_API_KEY || "";
        if (provider === "openai") effectiveApiKey = process.env.OPENAI_API_KEY || "";
        if (provider === "openrouter") effectiveApiKey = process.env.OPENROUTER_API_KEY || "";
      }

      if (!effectiveApiKey) {
        return NextResponse.json(
          { error: `Missing API Key for ${provider}. Please configure your key in Settings or set ${provider.toUpperCase()}_API_KEY in .env.local` },
          { status: 400 }
        );
      }

      const res = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: "API Error" } }));
        const errorMessage = err.detail || err.error?.message || err.title || err.message || `API Error (${res.status})`;
        return NextResponse.json({ error: errorMessage }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({
        reply: data.choices?.[0]?.message?.content || "No reply generated."
      });
    }

    // 3. Google Gemini
    if (provider === "gemini") {
      const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || "";
      if (!effectiveApiKey) {
        return NextResponse.json({ error: "Missing Gemini API Key. Configure key in Settings or set GEMINI_API_KEY in .env.local" }, { status: 400 });
      }

      const geminiModel = model || "gemini-1.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(effectiveApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: messages.map((m: any) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }))
          })
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: "Gemini Error" } }));
        return NextResponse.json({ error: err.error?.message || "Error calling Gemini API" }, { status: res.status });
      }

      const data = await res.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply generated.";
      return NextResponse.json({ reply: replyText });
    }

    return NextResponse.json({ error: "Unknown AI provider selected." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
