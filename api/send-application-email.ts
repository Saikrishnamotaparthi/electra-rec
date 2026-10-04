import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendConfirmationEmail, type ApplicationEmailPayload } from './lib/mailer.js';
import { markEmailResult } from './lib/firebaseAdmin.js';

const payloadSchema = z.object({
  applicationId: z.string().min(3).max(40),
  fullName: z.string().min(2).max(120),
  registrationNumber: z.string().min(2).max(40),
  email: z.string().email().max(160),
  phone: z.string().min(5).max(30),
  academicYear: z.string().min(1).max(40),
  branch: z.string().min(1).max(60),
  portfolio: z.string().min(1).max(80),
  role: z.string().min(1).max(40),
  existingMember: z.union([z.boolean(), z.null()]).optional(),
  existingTeam: z.union([z.string().max(80), z.null()]).optional(),
  docId: z.string().min(6).max(80).optional(),
});

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const MAX_RATE_BUCKETS = 5_000;

function pruneRateBuckets(now: number): void {
  if (rateBuckets.size <= MAX_RATE_BUCKETS) return;
  // Drop expired windows first; Map iteration order is insertion order.
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
  // Still over budget: evict the oldest entries so the map cannot grow without bound.
  for (const key of rateBuckets.keys()) {
    if (rateBuckets.size <= MAX_RATE_BUCKETS) break;
    rateBuckets.delete(key);
  }
}

function allowRequest(key: string, limit = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  pruneRateBuckets(now);
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function readBody(req: VercelRequest): unknown {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (!allowRequest(`send:${ip}`)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Try again shortly.' });
  }

  const body = readBody(req);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid application payload.',
    });
  }

  const payload: ApplicationEmailPayload = {
    applicationId: parsed.data.applicationId,
    fullName: parsed.data.fullName,
    registrationNumber: parsed.data.registrationNumber,
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone,
    academicYear: parsed.data.academicYear,
    branch: parsed.data.branch,
    portfolio: parsed.data.portfolio,
    role: parsed.data.role,
    existingMember: parsed.data.existingMember ?? null,
    existingTeam: parsed.data.existingTeam ?? null,
  };

  let messageId: string;
  try {
    messageId = await sendConfirmationEmail(payload);
  } catch (err) {
    console.error('send-application-email', err);
    const message = err instanceof Error ? err.message : 'Failed to send confirmation email.';
    if (parsed.data.docId) {
      try {
        await markEmailResult(parsed.data.docId, 'failed', message);
      } catch {
        // Admin credentials optional for send-only deployments.
      }
    }
    return res.status(502).json({ ok: false, error: message });
  }

  if (parsed.data.docId) {
    try {
      await markEmailResult(parsed.data.docId, 'sent', null);
    } catch (err) {
      // The email was already delivered; never fail the request over bookkeeping.
      console.error('send-application-email: delivered but status update failed', err);
    }
  }

  return res.status(200).json({ ok: true, messageId: messageId || null });
}
