// Cloudflare Worker Entry Point: Static Assets + Serverless Edge APIs + Security Headers

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Route /api/auth/login
    if (url.pathname === "/api/auth/login") {
      const loginModule = await import("../functions/api/auth/login");
      if (request.method === "POST") return loginModule.onRequestPost({ env, request });
    }

    // 2. Route /api/auth/verify
    if (url.pathname === "/api/auth/verify") {
      const verifyModule = await import("../functions/api/auth/verify");
      if (request.method === "GET") return verifyModule.onRequestGet({ env, request });
    }

    // 3. API: /api/blocks
    if (url.pathname === "/api/blocks") {
      const blocksModule = await import("../functions/api/blocks");
      if (request.method === "GET") return blocksModule.onRequestGet({ env, request });
      if (request.method === "POST") return blocksModule.onRequestPost({ env, request });
      if (request.method === "PUT") return blocksModule.onRequestPut({ env, request });
      if (request.method === "DELETE") return blocksModule.onRequestDelete({ env, request });
    }

    // 4. API: /api/routines
    if (url.pathname === "/api/routines") {
      const routinesModule = await import("../functions/api/routines");
      if (request.method === "GET") return routinesModule.onRequestGet({ env, request });
      if (request.method === "POST") return routinesModule.onRequestPost({ env, request });
      if (request.method === "DELETE") return routinesModule.onRequestDelete({ env, request });
    }

    // 5. API: /api/ai/chat
    if (url.pathname === "/api/ai/chat") {
      const chatModule = await import("../functions/api/ai/chat");
      if (request.method === "OPTIONS") return chatModule.onRequestOptions();
      return chatModule.onRequestPost({ env, request });
    }

    // 6. API: /api/ai/models
    if (url.pathname === "/api/ai/models") {
      const modelsModule = await import("../functions/api/ai/models");
      return modelsModule.onRequestGet({ env, request });
    }

    // 7. Static Assets Fallback (Serves Next.js exported files from /out)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      
      // Inject essential security headers on all responses
      const secureHeaders = new Headers(assetResponse.headers);
      secureHeaders.set("X-Frame-Options", "DENY");
      secureHeaders.set("X-Content-Type-Options", "nosniff");
      secureHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      secureHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      secureHeaders.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers: secureHeaders
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
