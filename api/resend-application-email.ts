import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendConfirmationEmail, type ApplicationEmailPayload } from '../server/mailer.js';
import { markEmailResult, verifyAdminIdToken } from '../server/firebaseAdmin.js';

const payloadSchema = z.object({
  idToken: z.string().min(20).max(4000),
  docId: z.string().min(6).max(80),
  applicationId: z.string().min(3).max(40),
  fullName: z.string().min(2).max(120),
  registrationNumber: z.string().min(2).max(40),
  email: z.string().email().max(160),
  phone: z.string().min(5).max(30),
  academicYear: z.string().min(1).max(40),
  branch: z.string().min(1).max(60),
  portfolio: z.string().min(1).max(80),
  role: z.string().min(1).max(40),
});

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

  const body = readBody(req);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid resend payload.',
    });
  }

  let adminEmail: string;
  try {
    adminEmail = await verifyAdminIdToken(parsed.data.idToken);
  } catch (err) {
    console.error('resend-application-email: auth failed', err);
    const message = err instanceof Error ? err.message : 'Not authorized to resend email.';
    const status = /not configured/i.test(message) ? 503 : 403;
    return res.status(status).json({ ok: false, error: message });
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
  };

  try {
    await sendConfirmationEmail(payload);
  } catch (err) {
    console.error('resend-application-email', err);
    const message = err instanceof Error ? err.message : 'Failed to resend confirmation email.';
    try {
      await markEmailResult(parsed.data.docId, 'failed', message);
    } catch {
      // Firestore admin may be unavailable; still return the email error.
    }
    return res.status(502).json({ ok: false, error: message });
  }

  try {
    await markEmailResult(parsed.data.docId, 'sent', null);
  } catch (err) {
    // The email was already delivered; never fail the request over bookkeeping.
    console.error('resend-application-email: delivered but status update failed', err);
  }

  return res.status(200).json({ ok: true, sentBy: adminEmail });
}
