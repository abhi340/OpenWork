// Cloudflare Pages Function: /api/routines
// With Anti-CSRF and Sanitized Payload Processing

import { validateCSRFToken, sanitizePayload, isSafeQueryParam } from "../../src/lib/security";

interface Env {
  DB: any;
}

function verifyCSRF(request: Request): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;

  const headerToken = request.headers.get("x-csrf-token");
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/__Host-csrf_token=([^;]+)/);
  const cookieToken = match ? match[1] : null;

  if (cookieToken && headerToken) {
    return validateCSRFToken(headerToken, cookieToken);
  }
  return true;
}

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const rawUserId = url.searchParams.get("userId") || "default_user";

    if (!isSafeQueryParam(rawUserId)) {
      return new Response(JSON.stringify({ error: "Invalid user identifier", routines: [] }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userId = rawUserId.trim();

    if (env.DB) {
      const stmt = env.DB.prepare(
        "SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC"
      ).bind(userId);
      const res = await stmt.all();
      const rows = (res.results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        blocks: typeof row.blocks === "string" ? JSON.parse(row.blocks || "[]") : (row.blocks || []),
        created_at: row.created_at
      }));
      return new Response(JSON.stringify({ routines: rows }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ routines: [] }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to fetch routines.", routines: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;

    if (!verifyCSRF(request)) {
      return new Response(JSON.stringify({ error: "Forbidden: CSRF validation failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawBody: any = await request.json().catch(() => ({}));
    const sanitizedBody = sanitizePayload(rawBody);

    const {
      id = crypto.randomUUID(),
      userId = "default_user",
      name = "Saved Routine",
      blocks = []
    } = sanitizedBody;

    if (env.DB) {
      const stmt = env.DB.prepare(
        `INSERT INTO routines (id, user_id, name, blocks, created_at) 
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).bind(
        id,
        userId,
        name,
        JSON.stringify(blocks)
      );

      await stmt.run();
    }

    return new Response(JSON.stringify({ success: true, routine: { id, name, blocks } }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to create routine template." }), {
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

    if (env.DB && id) {
      await env.DB.prepare("DELETE FROM routines WHERE id = ?").bind(id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to delete routine." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
