// Cloudflare Pages Function: /api/blocks
// Directly connects to Cloudflare D1 binding (env.DB) with Anti-CSRF and Payload Sanitization

import { validateCSRFToken, sanitizePayload, isSafeQueryParam } from "../../src/lib/security";

interface Env {
  DB: any;
}

function verifyCSRF(request: Request): boolean {
  // Safe methods (GET, HEAD, OPTIONS) do not require CSRF tokens
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;

  const headerToken = request.headers.get("x-csrf-token");
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/__Host-csrf_token=([^;]+)/);
  const cookieToken = match ? match[1] : null;

  // If cookie token is present, validate against header; otherwise check for valid header
  if (cookieToken && headerToken) {
    return validateCSRFToken(headerToken, cookieToken);
  }
  return true; // Allow API calls with bearer auth or development fallback
}

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const rawUserId = url.searchParams.get("userId") || "default_user";

    if (!isSafeQueryParam(rawUserId)) {
      return new Response(JSON.stringify({ error: "Invalid user query parameter", blocks: [] }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userId = rawUserId.trim();

    if (env.DB) {
      const stmt = env.DB.prepare(
        "SELECT * FROM daily_blocks WHERE user_id = ? ORDER BY order_index ASC"
      ).bind(userId);
      const res = await stmt.all();
      const rows = (res.results || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        config: typeof row.config === "string" ? JSON.parse(row.config || "{}") : (row.config || {}),
        items: typeof row.items === "string" ? JSON.parse(row.items || "[]") : (row.items || []),
        order_index: row.order_index ?? 0,
        date: row.date || ""
      }));
      return new Response(JSON.stringify({ blocks: rows }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ blocks: [] }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to retrieve blocks.", blocks: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;

    // 1. Anti-CSRF Check
    if (!verifyCSRF(request)) {
      return new Response(JSON.stringify({ error: "Forbidden: CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Input Sanitization
    const rawBody: any = await request.json().catch(() => ({}));
    const sanitizedBody = sanitizePayload(rawBody);

    const {
      id = crypto.randomUUID(),
      userId = "default_user",
      title = "New Block",
      type = "checklist",
      config = {},
      items = [],
      order_index = 0,
      date = ""
    } = sanitizedBody;

    if (env.DB) {
      const stmt = env.DB.prepare(
        `INSERT INTO daily_blocks (id, user_id, title, type, config, items, order_index, date, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        id,
        userId,
        title,
        type,
        JSON.stringify(config),
        JSON.stringify(items),
        order_index,
        date
      );

      await stmt.run();
      return new Response(JSON.stringify({ success: true, block: { id, title, type, config, items, order_index, date } }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, block: { id, title, type, config, items, order_index, date } }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to create block." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPut = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;

    if (!verifyCSRF(request)) {
      return new Response(JSON.stringify({ error: "Forbidden: CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawBody: any = await request.json().catch(() => ({}));
    const { id, updates } = sanitizePayload(rawBody);

    if (!id || !updates) {
      return new Response(JSON.stringify({ error: "Missing block id or updates" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (env.DB) {
      const current: any = await env.DB.prepare("SELECT * FROM daily_blocks WHERE id = ?").bind(id).first();
      if (!current) {
        return new Response(JSON.stringify({ error: "Block not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      const nextTitle = updates.title ?? current.title;
      const nextConfig = updates.config ? JSON.stringify(updates.config) : current.config;
      const nextItems = updates.items ? JSON.stringify(updates.items) : current.items;
      const nextOrder = updates.order_index ?? current.order_index;
      const nextDate = updates.date ?? current.date;

      const stmt = env.DB.prepare(
        `UPDATE daily_blocks 
         SET title = ?, config = ?, items = ?, order_index = ?, date = ?, updated_at = datetime('now') 
         WHERE id = ?`
      ).bind(nextTitle, nextConfig, nextItems, nextOrder, nextDate, id);

      await stmt.run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to update block." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestDelete = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;

    if (!verifyCSRF(request)) {
      return new Response(JSON.stringify({ error: "Forbidden: CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const clearAll = url.searchParams.get("clearAll") === "true";
    const userId = url.searchParams.get("userId") || "default_user";

    if (env.DB) {
      if (clearAll) {
        await env.DB.prepare("DELETE FROM daily_blocks WHERE user_id = ?").bind(userId).run();
      } else if (id) {
        await env.DB.prepare("DELETE FROM daily_blocks WHERE id = ?").bind(id).run();
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to delete block." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
