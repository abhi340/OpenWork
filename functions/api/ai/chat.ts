// Cloudflare Pages Function: /api/ai/chat

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

export const onRequestPost = async (context: { env: any; request: Request }) => {
  try {
    const body: any = await context.request.json();
    const { provider = "cloud", apiKey = "", baseUrl = "", model = "", messages = [] } = body;

    // 1. Local Ollama (Private local execution)
    if (provider === "ollama") {
      const targetBase = baseUrl || "http://127.0.0.1:11434";
      const targetModel = model || "llama3.2";

      try {
        const res = await fetch(`${targetBase}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: targetModel,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
          })
        });

        if (!res.ok) {
          const err: any = await res.json().catch(() => ({ error: "Ollama Error" }));
          return new Response(JSON.stringify({ error: err.error?.message || `Ollama unreachable at ${targetBase}. Ensure Ollama is running.` }), {
            status: res.status,
            headers: corsHeaders
          });
        }

        const data: any = await res.json();
        return new Response(JSON.stringify({
          reply: data.choices?.[0]?.message?.content || "No reply generated."
        }), {
          headers: corsHeaders
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: `Could not connect to Local Ollama (${targetBase}). Is Ollama running locally?` }), {
          status: 502,
          headers: corsHeaders
        });
      }
    }

    // 2. Cloud AI Provider (Any model via API Key + Model Name)
    const cleanKey = (apiKey || "").trim();
    const cleanModel = (model || "").trim();

    if (!cleanKey) {
      return new Response(JSON.stringify({ error: "Please enter your AI API Key in Settings." }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Determine target API endpoint
    let targetEndpoint = baseUrl;

    if (!targetEndpoint) {
      if (cleanKey.startsWith("gsk_") || cleanModel.includes("llama-3.3") || cleanModel.includes("mixtral")) {
        targetEndpoint = "https://api.groq.com/openai/v1";
      } else if (cleanKey.startsWith("nvapi-") || cleanModel.startsWith("nvidia/") || cleanModel.startsWith("meta/") || cleanModel.startsWith("mistralai/") || cleanModel.startsWith("deepseek-ai/")) {
        targetEndpoint = "https://integrate.api.nvidia.com/v1";
      } else if (cleanKey.startsWith("sk-or-") || cleanModel.includes("/")) {
        targetEndpoint = "https://openrouter.ai/api/v1";
      } else if (cleanModel.startsWith("gemini") || cleanKey.startsWith("AIzaSy")) {
        // Direct Google Gemini API
        const geminiModel = cleanModel || "gemini-1.5-flash";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(cleanKey)}`,
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
          const err: any = await res.json().catch(() => ({ error: { message: "Gemini API Error" } }));
          return new Response(JSON.stringify({ error: err.error?.message || `Gemini API Error (${res.status})` }), {
            status: res.status,
            headers: corsHeaders
          });
        }

        const data: any = await res.json();
        return new Response(JSON.stringify({
          reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply generated."
        }), {
          headers: corsHeaders
        });
      } else {
        // Default standard OpenAI endpoint
        targetEndpoint = "https://api.openai.com/v1";
      }
    }

    // Standard OpenAI-compatible format
    const effectiveModel = cleanModel || (cleanKey.startsWith("nvapi-") ? "deepseek-ai/deepseek-r1" : "gpt-4o-mini");
    const res = await fetch(`${targetEndpoint.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
      })
    });

    if (!res.ok) {
      const err: any = await res.json().catch(() => ({ error: { message: "API Error" } }));
      return new Response(JSON.stringify({ error: err.error?.message || err.detail || `AI Provider Error (${res.status})` }), {
        status: res.status,
        headers: corsHeaders
      });
    }

    const data: any = await res.json();
    return new Response(JSON.stringify({
      reply: data.choices?.[0]?.message?.content || "No reply generated."
    }), {
      headers: corsHeaders
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to process AI request" }), {
      status: 500,
      headers: corsHeaders
    });
  }
};
