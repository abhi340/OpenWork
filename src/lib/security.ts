// OpenWork Comprehensive Enterprise Security Module
// Standard Web Crypto & Platform Native Implementation (Zero Bloat, Edge & Node Compatible)

// -----------------------------------------------------------------------------
// 1. Cryptographic Password Hashing (PBKDF2-HMAC-SHA256 / Timing-Safe)
// -----------------------------------------------------------------------------
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

export function generateSalt(length = SALT_LENGTH): string {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex || generateSalt();
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBytes = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    KEY_LENGTH * 8
  );

  const hashHex = Array.from(new Uint8Array(derivedKey))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt };
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash: computedHash } = await hashPassword(password, salt);
  return timingSafeEqual(computedHash, storedHash);
}

// -----------------------------------------------------------------------------
// 2. Encrypted / Signed JWT & Session Management (HS256 Web Crypto)
// -----------------------------------------------------------------------------
export interface TokenPayload {
  sub: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'guest';
  sessionId: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'openwork_enterprise_security_jwt_secret_32bytes_min';

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signJWT(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresInSeconds: number): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(JWT_SECRET);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    const key = await getHmacKey(JWT_SECRET);
    const signatureBytes = new Uint8Array(
      base64UrlDecode(signatureB64).split('').map(c => c.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// 3. Rate Limiter & Brute-Force Account Lockout
// -----------------------------------------------------------------------------
interface RateLimitRecord {
  attempts: number;
  firstAttemptTimestamp: number;
  lockedUntil?: number;
}

const memoryRateLimitStore = new Map<string, RateLimitRecord>();

export const LOGIN_RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutDurationMs: 15 * 60 * 1000
};

export function checkRateLimit(
  identifier: string,
  options = LOGIN_RATE_LIMIT_CONFIG
): { isAllowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = memoryRateLimitStore.get(identifier);

  if (!record) {
    return { isAllowed: true, remainingAttempts: options.maxAttempts };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    return {
      isAllowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000)
    };
  }

  if (now - record.firstAttemptTimestamp > options.windowMs) {
    memoryRateLimitStore.delete(identifier);
    return { isAllowed: true, remainingAttempts: options.maxAttempts };
  }

  if (record.attempts >= options.maxAttempts) {
    record.lockedUntil = now + options.lockoutDurationMs;
    return {
      isAllowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(options.lockoutDurationMs / 1000)
    };
  }

  return { isAllowed: true, remainingAttempts: options.maxAttempts - record.attempts };
}

export function recordFailedAttempt(identifier: string, options = LOGIN_RATE_LIMIT_CONFIG): void {
  const now = Date.now();
  const record = memoryRateLimitStore.get(identifier);

  if (!record || now - record.firstAttemptTimestamp > options.windowMs) {
    memoryRateLimitStore.set(identifier, { attempts: 1, firstAttemptTimestamp: now });
  } else {
    record.attempts += 1;
    if (record.attempts >= options.maxAttempts) {
      record.lockedUntil = now + options.lockoutDurationMs;
    }
  }
}

export function resetRateLimit(identifier: string): void {
  memoryRateLimitStore.delete(identifier);
}

// -----------------------------------------------------------------------------
// 4. Anti-CSRF Double-Submit Tokens
// -----------------------------------------------------------------------------
export function generateCSRFToken(): string {
  const rawBytes = new Uint8Array(24);
  crypto.getRandomValues(rawBytes);
  return Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(headerToken?: string | null, cookieToken?: string | null): boolean {
  if (!headerToken || !cookieToken) return false;
  return timingSafeEqual(headerToken, cookieToken);
}

// -----------------------------------------------------------------------------
// 5. Input Sanitization & XSS / Injection Neutralizer
// -----------------------------------------------------------------------------
const HTML_XSS_PATTERN = /<[^>]*>?/gm;

export function sanitizeString(input: string): string {
  return input
    .replace(HTML_XSS_PATTERN, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function sanitizePayload<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizePayload(item)) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      sanitizedObj[sanitizeString(key)] = sanitizePayload(value);
    }
    return sanitizedObj as T;
  }
  return data;
}

// -----------------------------------------------------------------------------
// 6. SSRF & AI Gateway Allowlist Protection
// -----------------------------------------------------------------------------
const CLOUD_AI_ALLOWED_DOMAINS = [
  "api.openai.com",
  "api.groq.com",
  "openrouter.ai",
  "generativelanguage.googleapis.com",
  "integrate.api.nvidia.com",
  "api.nvidia.com"
];

export function validateAIEndpoint(
  rawUrl: string,
  provider: string
): { isValid: boolean; error?: string; cleanUrl?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "Missing or invalid URL." };
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, error: "Only HTTP and HTTPS protocols are permitted." };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (provider === "ollama") {
      const isLoopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
      if (!isLoopback) {
        return { isValid: false, error: "Local Ollama provider can only connect to localhost or 127.0.0.1." };
      }
      return { isValid: true, cleanUrl: parsed.origin };
    }

    const isAllowedCloudDomain = CLOUD_AI_ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (provider !== "custom" && !isAllowedCloudDomain) {
      return { isValid: false, error: `Unauthorized domain for ${provider} provider.` };
    }

    return { isValid: true, cleanUrl: parsed.origin };
  } catch {
    return { isValid: false, error: "Malformed endpoint URL." };
  }
}

const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b|--|\/\*|\*\/|;)/i;

export function isSafeQueryParam(param: string): boolean {
  return !SQL_INJECTION_PATTERN.test(param);
}

export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
    return "#";
  }
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function redactSensitiveData<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(clone)) {
    if (typeof clone[key] === "string") {
      if (
        key.toLowerCase().includes("apikey") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("password")
      ) {
        clone[key] = "[REDACTED]";
      }
    } else if (typeof clone[key] === "object" && clone[key] !== null) {
      clone[key] = redactSensitiveData(clone[key]);
    }
  }

  return clone;
}
