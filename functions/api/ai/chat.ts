// Cloudflare Edge Function: /api/ai/chat

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

function extractValidHttpUrl(input?: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return trimmed.replace(/\/+$/, "");
    } catch {}
  }
  const match = trimmed.match(/(https?:\/\/[^\s'"]+)/);
  if (match) {
    try {
      new URL(match[1]);
      return match[1].replace(/\/+$/, "");
    } catch {}
  }
  return "";
}

export const onRequestPost = async (context: { env: any; request: Request }) => {
  try {
    const body: any = await context.request.json();
    const { provider = "cloud", apiKey = "", baseUrl = "", model = "", messages = [] } = body;

    // 1. Local Ollama Execution with Cloudflare Tunnel & D1 Auto-Resolution
    if (provider === "ollama") {
      let targetBase = extractValidHttpUrl(baseUrl);
      const targetModel = model || "llama3.2";

      // If no valid external HTTPS URL was passed, try auto-resolving from D1 system_settings
      if (!targetBase || targetBase.includes("127.0.0.1") || targetBase.includes("localhost")) {
        const db = context.env?.DB;
        if (db) {
          try {
            const row: any = await db
              .prepare("SELECT value FROM system_settings WHERE key = 'ollama_tunnel_url'")
              .first();
            if (row && row.value) {
              targetBase = row.value.replace(/\/+$/, "");
            }
          } catch (e) {}
        }
      }

      // If we now have an active HTTPS tunnel, call Ollama through the tunnel
      if (targetBase && !targetBase.includes("127.0.0.1") && !targetBase.includes("localhost")) {
        try {
          const res = await fetch(`${targetBase}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: targetModel,
              messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
            })
          });

          if (res.ok) {
            const data: any = await res.json();
            const reply = data.choices?.[0]?.message?.content || data.message?.content;
            if (reply) {
              return new Response(JSON.stringify({ reply }), { headers: corsHeaders });
            }
          }
        } catch (err: any) {
          // If tunnel attempt failed and user has no cloud key, report error; otherwise fall through to Cloud AI
          if (!apiKey) {
            return new Response(JSON.stringify({
              error: `Could not reach Ollama via tunnel (${targetBase}): ${err.message}. Ensure your tunnel script is running.`
            }), { status: 502, headers: corsHeaders });
          }
        }
      }

      // If still on local loopback and user has NO Cloud API key, return instructional prompt
      if (!apiKey && (!targetBase || targetBase.includes("127.0.0.1") || targetBase.includes("localhost"))) {
        return new Response(JSON.stringify({
          error: "Cloudflare Server cannot reach local 127.0.0.1 directly. Run 'npm run tunnel' on your PC to auto-connect your local Ollama to Cloudflare!"
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // If user has a cloud API key (e.g. NVIDIA NIM or OpenAI), seamlessly fall through to Cloud AI!
    }

    // 2. Cloud AI Provider Execution
    const cleanKey = (apiKey || "").trim();
    const cleanModel = (model || "").trim();

    if (!cleanKey) {
      return new Response(JSON.stringify({ error: "Please enter your AI API Key in Settings." }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Determine target API endpoint & effective model
    let targetEndpoint = extractValidHttpUrl(baseUrl);
    let isNvidia = cleanKey.startsWith("nvapi-") || cleanModel.startsWith("nvidia/") || cleanModel.startsWith("meta/llama-3.2") || cleanModel.startsWith("mistralai/") || cleanModel.startsWith("deepseek-ai/");

    if (!targetEndpoint) {
      if (cleanKey.startsWith("gsk_") || cleanModel.includes("llama-3.3-70b-versatile") || cleanModel.includes("mixtral")) {
        targetEndpoint = "https://api.groq.com/openai/v1";
      } else if (isNvidia) {
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

    // Model selection with intelligent fallback
    let effectiveModel = cleanModel;
    if (isNvidia) {
      // If user has an NVIDIA key but the model is empty, default gpt-4o, or the retired llama-3.3-70b, switch to active llama-3.2-11b
      if (!effectiveModel || effectiveModel === "gpt-4o-mini" || effectiveModel.includes("llama-3.3-70b") || !effectiveModel.includes("/")) {
        effectiveModel = "meta/llama-3.2-11b-vision-instruct";
      }
    } else if (effectiveModel.startsWith("llama3.2") || effectiveModel.startsWith("llama-3.2")) {
      if (cleanKey.startsWith("gsk_")) {
        effectiveModel = "llama-3.3-70b-versatile";
      } else {
        effectiveModel = "gpt-4o-mini";
      }
    } else if (!effectiveModel) {
      effectiveModel = "gpt-4o-mini";
    }

    // Standard OpenAI-compatible format
    const requestPayload: any = {
      model: effectiveModel,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
    };

    // Add recommended parameters for NVIDIA NIM and Groq
    if (isNvidia) {
      requestPayload.max_tokens = 2048;
      requestPayload.temperature = 0.7;
    }

    const res = await fetch(`${targetEndpoint.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${cleanKey}`
      },
      body: JSON.stringify(requestPayload)
    });

    if (!res.ok) {
      const err: any = await res.json().catch(() => ({ error: { message: `AI Provider Error (${res.status})` } }));
      
      let errorMsg = 
        (typeof err.detail === "string" ? err.detail : "") ||
        err.error?.message ||
        err.message ||
        (err.title ? `${err.title}: ${JSON.stringify(err.detail || "")}` : "") ||
        `AI Provider Error (${res.status})`;

      // Specific actionable tips for NVIDIA NIM
      if (isNvidia) {
        if (res.status === 401 || res.status === 403) {
          errorMsg = `NVIDIA NIM Authorization Failed (${res.status}): Please check that your nvapi-... key is active in your build.nvidia.com dashboard.`;
        } else if (res.status === 410) {
          errorMsg = `NVIDIA NIM Model Retired: ${errorMsg}. Please select 'meta/llama-3.2-11b-vision-instruct' or 'nvidia/llama-3.1-nemotron-70b-instruct'.`;
        } else if (res.status === 404) {
          errorMsg = `NVIDIA NIM Model '${effectiveModel}' Not Found (404). Please pick an active model from the dropdown.`;
        }
      }

      return new Response(JSON.stringify({ error: errorMsg }), {
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

