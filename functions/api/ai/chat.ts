// Cloudflare Pages Function: /api/ai/chat
export const onRequestPost = async (context: { env: any; request: Request }) => {
  try {
    const body: any = await context.request.json();
    const { provider = "ollama", apiKey = "", baseUrl = "", model = "", messages = [] } = body;

    // OpenAI / Groq / OpenRouter / NVIDIA NIM
    if (["openai", "groq", "openrouter", "nvidia", "custom"].includes(provider)) {
      let defaultEndpoint = "https://api.openai.com/v1";
      if (provider === "groq") defaultEndpoint = "https://api.groq.com/openai/v1";
      if (provider === "openrouter") defaultEndpoint = "https://openrouter.ai/api/v1";
      if (provider === "nvidia") defaultEndpoint = "https://integrate.api.nvidia.com/v1";

      const endpoint = baseUrl || defaultEndpoint;
      const targetModel = model || (provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

      const res = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const err: any = await res.json().catch(() => ({ error: { message: "API Error" } }));
        return new Response(JSON.stringify({ error: err.error?.message || err.detail || `API Error (${res.status})` }), {
          status: res.status,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data: any = await res.json();
      return new Response(JSON.stringify({
        reply: data.choices?.[0]?.message?.content || "No reply generated."
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Google Gemini
    if (provider === "gemini") {
      const geminiModel = model || "gemini-1.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(apiKey)}`,
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

      const data: any = await res.json();
      return new Response(JSON.stringify({
        reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply generated."
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown or local-only AI provider." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
