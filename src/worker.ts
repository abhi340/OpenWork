// Cloudflare Worker Entry Point: Static Assets + Serverless Edge APIs + D1 Binding

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. API: /api/blocks
    if (url.pathname === "/api/blocks") {
      const blocksModule = await import("../functions/api/blocks");
      if (request.method === "GET") return blocksModule.onRequestGet({ env, request });
      if (request.method === "POST") return blocksModule.onRequestPost({ env, request });
      if (request.method === "PUT") return blocksModule.onRequestPut({ env, request });
      if (request.method === "DELETE") return blocksModule.onRequestDelete({ env, request });
    }

    // 2. API: /api/routines
    if (url.pathname === "/api/routines") {
      const routinesModule = await import("../functions/api/routines");
      if (request.method === "GET") return routinesModule.onRequestGet({ env, request });
      if (request.method === "POST") return routinesModule.onRequestPost({ env, request });
      if (request.method === "DELETE") return routinesModule.onRequestDelete({ env, request });
    }

    // 3. API: /api/ai/chat
    if (url.pathname === "/api/ai/chat") {
      const chatModule = await import("../functions/api/ai/chat");
      return chatModule.onRequestPost({ env, request });
    }

    // 4. API: /api/ai/models
    if (url.pathname === "/api/ai/models") {
      const modelsModule = await import("../functions/api/ai/models");
      return modelsModule.onRequestGet({ env, request });
    }

    // 5. Static Assets Fallback (Serves Next.js exported files from /out)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
