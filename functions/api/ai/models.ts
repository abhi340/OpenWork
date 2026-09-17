// Cloudflare Edge Function: /api/ai/models

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

const TOP_NVIDIA_MODELS = [
  "meta/llama-3.2-11b-vision-instruct",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "mistralai/mistral-large-2-instruct",
  "deepseek-ai/deepseek-v4-flash-0731",
  "google/gemma-3-12b-it",
  "meta/llama-3.2-90b-vision-instruct",
  "ibm/granite-3.0-8b-instruct",
  "nvidia/llama-3.1-nemotron-51b-instruct",
  "ai21labs/jamba-1.5-large-instruct"
];

export const onRequestGet = async (context: { env: any; request: Request }) => {
  try {
    const url = new URL(context.request.url);
    const provider = url.searchParams.get("provider") || "nvidia";
    const apiKey = url.searchParams.get("apiKey") || "";

    if (provider === "groq") {
      return new Response(JSON.stringify({
        models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"]
      }), { headers: corsHeaders });
    }

    if (provider === "nvidia") {
      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

        const res = await fetch("https://integrate.api.nvidia.com/v1/models", { headers });
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data.data) && data.data.length > 0) {
            const liveChatModels = data.data
              .map((m: any) => m.id)
              .filter((id: string) => 
                (id.includes("instruct") || id.includes("vision") || id.includes("chat") || id.includes("flash")) &&
                !id.includes("llama-3.3-70b") // Retired by NVIDIA
              );

            // Prioritize top recommended models at the front
            const ordered = [
              ...TOP_NVIDIA_MODELS.filter((m) => liveChatModels.includes(m)),
              ...liveChatModels.filter((m: string) => !TOP_NVIDIA_MODELS.includes(m))
            ];

            if (ordered.length > 0) {
              return new Response(JSON.stringify({ models: ordered }), { headers: corsHeaders });
            }
          }
        }
      } catch (e) {}

      return new Response(JSON.stringify({ models: TOP_NVIDIA_MODELS }), { headers: corsHeaders });
    }

    if (provider === "gemini") {
      return new Response(JSON.stringify({
        models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-lite-preview-02-05"]
      }), { headers: corsHeaders });
    }

    if (provider === "openai") {
      return new Response(JSON.stringify({
        models: ["gpt-4o-mini", "gpt-4o", "o3-mini", "o1-mini"]
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ models: [] }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, models: [] }), {
      status: 500,
      headers: corsHeaders
    });
  }
};

