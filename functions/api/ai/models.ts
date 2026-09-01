// Cloudflare Pages Function: /api/ai/models
export const onRequestGet = async (context: { env: any; request: Request }) => {
  try {
    const url = new URL(context.request.url);
    const provider = url.searchParams.get("provider") || "nvidia";
    const apiKey = url.searchParams.get("apiKey") || "";

    if (provider === "groq") {
      return new Response(JSON.stringify({
        models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"]
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (provider === "nvidia") {
      return new Response(JSON.stringify({
        models: [
          "meta/llama-3.2-11b-vision-instruct",
          "meta/llama-3.3-70b-instruct",
          "meta/llama-3.1-8b-instruct",
          "mistralai/mistral-large-2-instruct",
          "nvidia/llama-3.1-nemotron-70b-instruct"
        ]
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (provider === "gemini") {
      return new Response(JSON.stringify({
        models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (provider === "openai") {
      return new Response(JSON.stringify({
        models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"]
      }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ models: [] }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, models: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
