// Unified Universal AI Client for OpenWork

export interface ModelOption {
  id: string;
  name: string;
  providerName: string;
}

// Safely extract a valid http:// or https:// URL, even if user pasted a CLI command (e.g. "cloudflared tunnel --url https://...")
export function extractValidHttpUrl(input?: string): string {
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

// Auto-detect provider & fetch real available models for any API key
export async function detectModelsFromApiKey(apiKey: string, customBaseUrl = ""): Promise<{
  providerName: string;
  models: string[];
}> {
  const cleanKey = apiKey.trim();
  const sanitizedBaseUrl = extractValidHttpUrl(customBaseUrl);
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
    // 1. Try fetching live models from edge server (bypasses browser CORS)
    try {
      const edgeRes = await fetch(`/api/ai/models?provider=nvidia&apiKey=${encodeURIComponent(cleanKey)}`);
      if (edgeRes.ok) {
        const data = await edgeRes.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          return { providerName: "NVIDIA NIM", models: data.models };
        }
      }
    } catch (e) {}

    // 2. Fallback to active NVIDIA NIM chat & vision models (excluding retired models like llama-3.3-70b)
    return {
      providerName: "NVIDIA NIM",
      models: [
        "meta/llama-3.2-11b-vision-instruct",
        "nvidia/llama-3.1-nemotron-70b-instruct",
        "mistralai/mistral-large-2-instruct",
        "deepseek-ai/deepseek-v4-flash-0731",
        "google/gemma-3-12b-it",
        "meta/llama-3.2-90b-vision-instruct",
        "ibm/granite-3.0-8b-instruct",
        "nvidia/llama-3.1-nemotron-51b-instruct"
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

// Auto-detect installed local Ollama models across 127.0.0.1 and localhost
export async function detectOllamaModels(customBaseUrl = ""): Promise<{
  isConnected: boolean;
  models: string[];
  activeUrl: string;
}> {
  const sanitized = extractValidHttpUrl(customBaseUrl);
  const candidateHosts = sanitized
    ? [sanitized]
    : ["http://127.0.0.1:11434", "http://localhost:11434"];

  for (const host of candidateHosts) {
    try {
      const res = await fetch(`${host}/api/tags`, { method: "GET" }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          const list: string[] = [];
          for (const m of data.models) {
            if (m.name && !list.includes(m.name)) list.push(m.name);
            const shortName = m.name?.split(":")[0];
            if (shortName && !list.includes(shortName)) list.push(shortName);
          }
          return { isConnected: true, models: list, activeUrl: host };
        }
        return { isConnected: true, models: [], activeUrl: host };
      }
    } catch (e) {}
  }

  return { isConnected: false, models: [], activeUrl: candidateHosts[0] };
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
  const isHttpsPage = typeof window !== "undefined" && window.location.protocol === "https:";

  // A. Local Ollama Execution
  if (provider === "ollama") {
    const rawUrl = extractValidHttpUrl(baseUrl);
    const isLocalUrl = !rawUrl || rawUrl.includes("127.0.0.1") || rawUrl.includes("localhost");
    const isTunnelUrl = rawUrl.startsWith("https://");

    // If on an HTTPS domain (e.g. Cloudflare) and user provided an HTTPS tunnel or remote server, proxy through edge
    if (isTunnelUrl) {
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
              provider: "ollama",
              baseUrl: rawUrl,
              model: model || "llama3.2",
              messages
            })
          });

          const data = await res.json();
          if (res.ok && data.reply) {
            return { reply: data.reply };
          }
          if (data.error) {
            return { reply: "", error: data.error };
          }
        } catch (e) {}
      }
    }

    // Direct Browser Execution for Ollama (Works on localhost or custom direct domains)
    const candidateHosts = rawUrl
      ? [rawUrl]
      : ["http://127.0.0.1:11434", "http://localhost:11434"];
    
    const rawModel = (model || "").trim();
    const candidateModels = [
      rawModel,
      rawModel && !rawModel.includes(":") ? `${rawModel}:latest` : "",
      rawModel && rawModel.includes(":") ? rawModel.split(":")[0] : "",
      "llama3.2:latest",
      "llama3.2"
    ].filter(Boolean);

    for (const host of candidateHosts) {
      for (const targetModel of candidateModels) {
        // 1. Native Ollama /api/chat
        try {
          const res = await fetch(`${host}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: targetModel,
              messages: messages.map((m) => ({
                role: m.role === "system" ? "system" : m.role === "assistant" ? "assistant" : "user",
                content: m.content
              })),
              stream: false
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.message?.content) {
              return { reply: data.message.content };
            }
          }
        } catch (e) {}

        // 2. OpenAI-compatible /v1/chat/completions
        try {
          const res = await fetch(`${host}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: targetModel,
              messages: messages.map((m) => ({ role: m.role, content: m.content }))
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.choices?.[0]?.message?.content) {
              return { reply: data.choices[0].message.content };
            }
          }
        } catch (e) {}
      }
    }

    // If direct local fetch failed on an HTTPS host, explain Mixed Content security block
    if (isHttpsPage && isLocalUrl) {
      return {
        reply: "",
        error: "Browser Security Block: Your browser blocks HTTPS pages (Cloudflare) from connecting to insecure 'http://127.0.0.1:11434'. To use Local Ollama on Cloudflare: 1) Run 'cloudflared tunnel --url http://localhost:11434' (or 'ngrok http 11434'), 2) Paste the https:// tunnel URL into Settings -> Ollama Endpoint URL."
      };
    }

    return {
      reply: "",
      error: `Could not connect to Ollama (${candidateHosts[0]}). Make sure Ollama is running and OLLAMA_ORIGINS="*" is set.`
    };
  }

  // B. Cloud AI Execution
  const cleanKey = (apiKey || "").trim();
  const cleanModel = (model || "").trim();

  if (!cleanKey) {
    return { reply: "", error: "Please enter your AI API key in Settings." };
  }

  const isNvidia = cleanKey.startsWith("nvapi-") || cleanModel.startsWith("nvidia/") || cleanModel.startsWith("meta/llama-3.2") || cleanModel.startsWith("mistralai/") || cleanModel.startsWith("deepseek-ai/");

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
  const validCustomEndpoint = extractValidHttpUrl(baseUrl);
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
          baseUrl: validCustomEndpoint,
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
  let targetEndpoint = validCustomEndpoint;
  if (!targetEndpoint) {
    if (cleanKey.startsWith("gsk_") || cleanModel.includes("llama-3.3-70b-versatile") || cleanModel.includes("mixtral")) {
      targetEndpoint = "https://api.groq.com/openai/v1";
    } else if (isNvidia) {
      targetEndpoint = "https://integrate.api.nvidia.com/v1";
    } else if (cleanKey.startsWith("sk-or-")) {
      targetEndpoint = "https://openrouter.ai/api/v1";
    } else {
      targetEndpoint = "https://api.openai.com/v1";
    }
  }

  const endpoint = targetEndpoint.replace(/\/+$/, "");
  let targetModel = cleanModel;
  if (isNvidia) {
    if (!targetModel || targetModel === "gpt-4o-mini" || targetModel.includes("llama-3.3-70b") || !targetModel.includes("/")) {
      targetModel = "meta/llama-3.2-11b-vision-instruct";
    }
  } else if (!targetModel) {
    targetModel = "gpt-4o-mini";
  }

  const requestPayload: any = {
    model: targetModel,
    messages: messages.map((m) => ({ role: m.role, content: m.content }))
  };
  if (isNvidia) {
    requestPayload.max_tokens = 2048;
    requestPayload.temperature = 0.7;
  }

  try {
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${cleanKey}`
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await res.json();
    if (!res.ok) {
      let errorMsg = 
        (typeof data.detail === "string" ? data.detail : "") ||
        data.error?.message ||
        data.message ||
        (data.title ? `${data.title}: ${JSON.stringify(data.detail || "")}` : "") ||
        `AI Provider Error (${res.status})`;

      if (isNvidia && (res.status === 401 || res.status === 403)) {
        errorMsg = `NVIDIA NIM Authorization Failed (${res.status}): Please check your nvapi-... key in build.nvidia.com.`;
      }
      return { reply: "", error: errorMsg };
    }
    return { reply: data.choices?.[0]?.message?.content || "No reply generated." };
  } catch (err: any) {
    return { reply: "", error: `Connection failed: ${err.message}. Please verify your API key and model.` };
  }
}

