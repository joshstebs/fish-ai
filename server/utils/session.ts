import crypto from 'crypto';
import type { Request } from 'express';

export type FishSessionKind = 'owner' | 'subscriber' | 'recovery';

export interface FishSessionClaims {
  v: 1;
  kind: FishSessionKind;
  sub: string;
  iat: number;
  exp: number;
}

export const OWNER_COOKIE = 'fishai_owner';
export const SUBSCRIBER_COOKIE = 'fishai_subscriber';

const VERSION = 'v1';
const MIN_SECRET_LENGTH = 32;

function secret(): string {
  return process.env.FISH_SESSION_SECRET || '';
}

export function sessionConfigured(): boolean {
  return secret().length >= MIN_SECRET_LENGTH;
}

function key(): Buffer {
  const value = secret();
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error('FISH_SESSION_SECRET must be at least 32 characters.');
  }
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

function encode(value: Buffer): string {
  return value.toString('base64url');
}

function decode(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

export function issueSession(
  kind: FishSessionKind,
  subject: string,
  ttlSeconds: number,
): string {
  if (!subject) throw new Error('Session subject is required.');
  const now = Math.floor(Date.now() / 1000);
  const claims: FishSessionClaims = {
    v: 1,
    kind,
    sub: subject,
    iat: now,
    exp: now + Math.max(60, ttlSeconds),
  };

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(VERSION, 'utf8'));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(claims), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [VERSION, encode(iv), encode(ciphertext), encode(tag)].join('.');
}

export function verifySession(
  token: string,
  allowedKinds?: readonly FishSessionKind[],
): FishSessionClaims | null {
  if (!token || !sessionConfigured()) return null;
  try {
    const [version, ivRaw, ciphertextRaw, tagRaw, extra] = token.split('.');
    if (version !== VERSION || !ivRaw || !ciphertextRaw || !tagRaw || extra) return null;

    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), decode(ivRaw));
    decipher.setAAD(Buffer.from(VERSION, 'utf8'));
    decipher.setAuthTag(decode(tagRaw));
    const plaintext = Buffer.concat([
      decipher.update(decode(ciphertextRaw)),
      decipher.final(),
    ]).toString('utf8');

    const claims = JSON.parse(plaintext) as Partial<FishSessionClaims>;
    const now = Math.floor(Date.now() / 1000);
    if (
      claims.v !== 1 ||
      typeof claims.kind !== 'string' ||
      typeof claims.sub !== 'string' ||
      !claims.sub ||
      typeof claims.iat !== 'number' ||
      typeof claims.exp !== 'number' ||
      claims.exp <= now ||
      claims.iat > now + 60
    ) return null;

    if (!['owner', 'subscriber', 'recovery'].includes(claims.kind)) return null;
    if (allowedKinds && !allowedKinds.includes(claims.kind as FishSessionKind)) return null;
    return claims as FishSessionClaims;
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const raw = req.get('cookie') || '';
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!name || !value) continue;
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}

export function cookieSession(
  req: Request,
  cookieName: string,
  allowedKinds: readonly FishSessionKind[],
): FishSessionClaims | null {
  const token = parseCookies(req)[cookieName] || '';
  return verifySession(token, allowedKinds);
}

function cookieBase(): string {
  const secure = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function sessionCookie(
  cookieName: string,
  token: string,
  maxAgeSeconds: number,
): string {
  return `${cookieName}=${encodeURIComponent(token)}; ${cookieBase()}; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`;
}

export function clearSessionCookie(cookieName: string): string {
  return `${cookieName}=; ${cookieBase()}; Max-Age=0`;
}
