// Cloudflare Edge Function: /api/ai/tunnel
// Stores and retrieves active HTTPS Cloudflare Tunnel URL for local Ollama

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

export const onRequestGet = async (context: { env: any; request: Request }) => {
  try {
    const db = context.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ tunnelUrl: "", isOnline: false }), {
        headers: corsHeaders
      });
    }

    const row: any = await db
      .prepare("SELECT value, updated_at FROM system_settings WHERE key = 'ollama_tunnel_url'")
      .first();

    if (!row || !row.value) {
      return new Response(JSON.stringify({ tunnelUrl: "", isOnline: false }), {
        headers: corsHeaders
      });
    }

    const tunnelUrl = row.value;
    const updatedAt = Number(row.updated_at) || 0;

    // Quick health probe with 2.5s timeout
    let isOnline = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const probe = await fetch(`${tunnelUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);
      isOnline = probe.ok;
    } catch (e) {
      isOnline = false;
    }

    return new Response(
      JSON.stringify({
        tunnelUrl,
        updatedAt,
        isOnline
      }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ tunnelUrl: "", isOnline: false, error: err.message }),
      { headers: corsHeaders }
    );
  }
};

export const onRequestPost = async (context: { env: any; request: Request }) => {
  try {
    const db = context.env?.DB;
    const body: any = await context.request.json().catch(() => ({}));
    const rawUrl = body.tunnelUrl || body.url || "";
    const sanitized = extractValidHttpUrl(rawUrl);

    if (!sanitized) {
      return new Response(
        JSON.stringify({ error: "Invalid tunnel URL provided." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    if (db) {
      await db
        .prepare(
          "INSERT INTO system_settings (key, value, updated_at) VALUES ('ollama_tunnel_url', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
        )
        .bind(sanitized, now)
        .run();
    }

    return new Response(
      JSON.stringify({ success: true, tunnelUrl: sanitized, updatedAt: now }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to update tunnel URL." }),
      { status: 500, headers: corsHeaders }
    );
  }
};
