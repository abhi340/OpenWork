// Cloudflare Pages Function: /api/auth/verify
// Introspects Session JWT & Validates Permissions

import { verifyJWT } from "../../../src/lib/security";

export const onRequestGet = async (context: { env: any; request: Request }) => {
  try {
    const { request } = context;
    const cookieHeader = request.headers.get("cookie") || "";
    
    // Extract __Host-access_token from cookies or Bearer token header
    let token = "";
    const match = cookieHeader.match(/__Host-access_token=([^;]+)/);
    if (match) {
      token = match[1];
    } else {
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      return new Response(JSON.stringify({ authenticated: false, error: "No active session found." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return new Response(JSON.stringify({ authenticated: false, error: "Session expired or invalid." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ authenticated: false, error: "Verification failed." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
