// OpenWork Security Utilities & Defense Guardrails

// Private and sensitive IP ranges to block from SSRF
const BLOCKED_HOST_PATTERNS = [
  /^169\.254\./, // AWS / Cloud metadata link-local
  /^10\./, // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
  /^192\.168\./, // Class C private
  /^0\./, // Current network
  /^127\./, // Loopback (handled specially for Ollama)
  /^localhost$/i,
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 ULA
  /^fe80:/i // IPv6 link-local
];

// Verified domain allowlist for cloud AI providers
const CLOUD_AI_ALLOWED_DOMAINS = [
  "api.openai.com",
  "api.groq.com",
  "openrouter.ai",
  "generativelanguage.googleapis.com",
  "integrate.api.nvidia.com",
  "api.nvidia.com"
];

/**
 * Validates whether an AI endpoint URL is secure and permissible to fetch server-side.
 * Defends against Server-Side Request Forgery (SSRF) and metadata exfiltration.
 */
export function validateAIEndpoint(
  rawUrl: string,
  provider: string
): { isValid: boolean; error?: string; cleanUrl?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "Missing or invalid URL." };
  }

  try {
    const parsed = new URL(rawUrl);

    // Protocol check: Only http/https permitted
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, error: "Only HTTP and HTTPS protocols are permitted." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 1. Ollama provider: Strictly allow localhost/127.0.0.1 on valid ports
    if (provider === "ollama") {
      const isLoopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
      if (!isLoopback) {
        return { isValid: false, error: "Local Ollama provider can only connect to localhost or 127.0.0.1." };
      }
      return { isValid: true, cleanUrl: parsed.origin };
    }

    // 2. Cloud AI providers (openai, groq, openrouter, gemini)
    const isAllowedCloudDomain = CLOUD_AI_ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (isAllowedCloudDomain) {
      if (parsed.protocol !== "https:") {
        return { isValid: false, error: "Cloud AI providers must connect over HTTPS." };
      }
      return { isValid: true, cleanUrl: parsed.origin + parsed.pathname.replace(/\/$/, "") };
    }

    // 3. Custom provider: Must be HTTPS and cannot target private/internal networks
    if (provider === "custom") {
      if (parsed.protocol !== "https:") {
        return { isValid: false, error: "Custom endpoints must use HTTPS." };
      }

      for (const pattern of BLOCKED_HOST_PATTERNS) {
        if (pattern.test(hostname)) {
          return { isValid: false, error: "Requests to internal or private IP addresses are blocked." };
        }
      }

      return { isValid: true, cleanUrl: parsed.origin + parsed.pathname.replace(/\/$/, "") };
    }

    return { isValid: false, error: `Unauthorized host for provider '${provider}': ${hostname}` };
  } catch {
    return { isValid: false, error: "Malformed URL provided." };
  }
}

/**
 * Sanitizes URLs to prevent Cross-Site Scripting (XSS) via javascript: or data: URIs.
 */
export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "#";
  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {}

  return "#";
}
