// Unified Universal AI Client for OpenWork

export interface ModelOption {
  id: string;
  name: string;
  providerName: string;
}

// Auto-detect provider & fetch real available models for any API key
export async function detectModelsFromApiKey(apiKey: string, customBaseUrl = ""): Promise<{
  providerName: string;
  models: string[];
}> {
  const cleanKey = apiKey.trim();
  if (!cleanKey || cleanKey.length < 6) {
    return { providerName: "", models: [] };
  }

  // 1. Groq (gsk_...)
  if (cleanKey.startsWith("gsk_")) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${cleanKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const list = data.data.map((m: any) => m.id).filter((id: string) => !id.includes("whisper"));
          return { providerName: "Groq (High-Speed)", models: list };
        }
      }
    } catch (e) {}
    return {
      providerName: "Groq",
      models: [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
        "llama-guard-3-8b"
      ]
    };
  }

  // 2. NVIDIA NIM (nvapi-...)
  if (cleanKey.startsWith("nvapi-")) {
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
        headers: { Authorization: `Bearer ${cleanKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const list = data.data.map((m: any) => m.id);
          return { providerName: "NVIDIA NIM", models: list };
        }
      }
    } catch (e) {}
    return {
      providerName: "NVIDIA NIM",
      models: [
        "meta/llama-3.3-70b-instruct",
        "nvidia/llama-3.1-nemotron-70b-instruct",
        "meta/llama-3.2-11b-vision-instruct",
        "mistralai/mistral-large-2-instruct",
        "deepseek-ai/deepseek-r1"
      ]
    };
  }

  // 3. Google Gemini (AIzaSy...)
  if (cleanKey.startsWith("AIzaSy") || cleanKey.length === 39) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          const list = data.models
            .map((m: any) => m.name.replace("models/", ""))
            .filter((name: string) => name.includes("gemini"));
          if (list.length > 0) {
            return { providerName: "Google Gemini", models: list };
          }
        }
      }
    } catch (e) {}
    return {
      providerName: "Google Gemini",
      models: [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-lite-preview-02-05"
      ]
    };
  }

  // 4. OpenRouter (sk-or-...)
  if (cleanKey.startsWith("sk-or-")) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${cleanKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const list = data.data.slice(0, 25).map((m: any) => m.id);
          return { providerName: "OpenRouter", models: list };
        }
      }
    } catch (e) {}
    return {
      providerName: "OpenRouter",
      models: [
        "anthropic/claude-3.5-sonnet",
        "deepseek/deepseek-r1",
        "meta-llama/llama-3.3-70b-instruct",
        "google/gemini-2.0-flash-exp:free"
      ]
    };
  }

  // 5. OpenAI / Custom API Key (sk-...)
  if (cleanKey.startsWith("sk-") || customBaseUrl) {
    const targetUrl = (customBaseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
    try {
      const res = await fetch(`${targetUrl}/models`, {
        headers: { Authorization: `Bearer ${cleanKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          const list = data.data
            .map((m: any) => m.id)
            .filter((id: string) => !id.includes("tts") && !id.includes("dall-e") && !id.includes("embedding"));
          return { providerName: customBaseUrl ? "Custom API" : "OpenAI", models: list };
        }
      }
    } catch (e) {}
    return {
      providerName: "OpenAI",
      models: [
        "gpt-4o-mini",
        "gpt-4o",
        "o3-mini",
        "o1-mini",
        "gpt-4-turbo"
      ]
    };
  }

  // Generic fallback
  return {
    providerName: "Cloud AI",
    models: [
      "gpt-4o-mini",
      "llama-3.3-70b-versatile",
      "gemini-2.0-flash",
      "deepseek-chat",
      "gpt-4o"
    ]
  };
}

// Universal Chat Execution (Direct Client API with resilient Edge Gateway fallback)
export async function sendAIChatRequest(params: {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<{ reply: string; error?: string }> {
  const { provider = "cloud", apiKey = "", baseUrl = "", model = "", messages } = params;

  // A. Local Ollama Execution (Runs directly on local machine)
  if (provider === "ollama") {
    const targetBase = (baseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
    const targetModel = model || "llama3.2";

    try {
      const res = await fetch(`${targetBase}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          messages: messages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        return { reply: "", error: `Ollama error (${res.status}). Ensure Ollama is running at ${targetBase}` };
      }

      const data = await res.json();
      return { reply: data.choices?.[0]?.message?.content || "No reply generated." };
    } catch (err: any) {
      return { reply: "", error: `Could not connect to Local Ollama (${targetBase}). Is Ollama running on your machine?` };
    }
  }

  // B. Cloud AI Execution
  const cleanKey = (apiKey || "").trim();
  const cleanModel = (model || "").trim();

  if (!cleanKey) {
    return { reply: "", error: "Please enter your AI API key in Settings." };
  }

  // 1. Google Gemini (Google natively supports browser CORS)
  if (cleanKey.startsWith("AIzaSy") || cleanModel.startsWith("gemini")) {
    const geminiModel = cleanModel || "gemini-1.5-flash";
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(cleanKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }))
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        return { reply: "", error: data.error?.message || `Gemini API Error (${res.status})` };
      }
      return { reply: data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply generated." };
    } catch (err: any) {
      // Proceed to server proxy below if direct browser fails
    }
  }

  // 2. Resilient Edge Proxy Execution (Groq, NVIDIA NIM, OpenAI, OpenRouter, Custom)
  const proxyEndpoints = [
    "/api/ai/chat",
    "https://openwork.abhicm019.workers.dev/api/ai/chat"
  ];

  for (const endpoint of proxyEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "cloud",
          apiKey: cleanKey,
          baseUrl: baseUrl || "",
          model: cleanModel,
          messages
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) {
          return { reply: "", error: data.error || `AI Error (${res.status})` };
        }
        if (data.reply) {
          return { reply: data.reply };
        }
      }
    } catch (proxyErr) {
      // Continue to next proxy endpoint
    }
  }

  // 3. Direct Browser fallback if proxies were unreachable
  let targetEndpoint = baseUrl;
  if (!targetEndpoint) {
    if (cleanKey.startsWith("gsk_") || cleanModel.includes("llama-3.3") || cleanModel.includes("mixtral")) {
      targetEndpoint = "https://api.groq.com/openai/v1";
    } else if (cleanKey.startsWith("nvapi-") || cleanModel.startsWith("nvidia/") || cleanModel.startsWith("meta/") || cleanModel.startsWith("deepseek-ai/")) {
      targetEndpoint = "https://integrate.api.nvidia.com/v1";
    } else if (cleanKey.startsWith("sk-or-")) {
      targetEndpoint = "https://openrouter.ai/api/v1";
    } else {
      targetEndpoint = "https://api.openai.com/v1";
    }
  }

  const endpoint = targetEndpoint.replace(/\/+$/, "");
  const targetModel = cleanModel || "gpt-4o-mini";

  try {
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content }))
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return { reply: "", error: data.error?.message || data.detail || `AI Provider Error (${res.status})` };
    }
    return { reply: data.choices?.[0]?.message?.content || "No reply generated." };
  } catch (err: any) {
    return { reply: "", error: `Connection failed: ${err.message}. Please verify your API key and model.` };
  }
}
