import crypto from "node:crypto";

// Basit, bağımlılıksız bir "imzalı çerez" (signed cookie) uygulaması.
// JWT kütüphanesi kullanmadan HMAC-SHA256 ile içerik imzalanır.

const SECRET = process.env.SESSION_SECRET || "gelistirme-icin-varsayilan-anahtar";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 gün

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string) {
  return base64url(crypto.createHmac("sha256", SECRET).update(payload).digest());
}

export type SessionPayload = {
  userId: string;
  exp: number; // unix seconds
};

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const payloadStr = base64url(JSON.stringify(payload));
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, signature] = parts;
  const expectedSignature = sign(payloadStr);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(
      payloadStr.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
