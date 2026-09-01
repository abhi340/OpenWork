// Cloudflare Pages Function: /api/routines
interface Env {
  DB: any;
}

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || "default_user";

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
    return new Response(JSON.stringify({ error: err.message, routines: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;
    const body: any = await request.json();
    const {
      id = crypto.randomUUID(),
      userId = "default_user",
      name = "Saved Routine",
      blocks = []
    } = body;

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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestDelete = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (env.DB && id) {
      await env.DB.prepare("DELETE FROM routines WHERE id = ?").bind(id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
