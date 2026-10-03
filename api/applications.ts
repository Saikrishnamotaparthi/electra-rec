import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminApp, getFirestoreClient } from './lib/firebaseAdmin.js';
import { sendConfirmationEmail } from './lib/mailer.js';

const APPLICATION_ID_PREFIX = 'GE26';

const payloadSchema = z.object({
  personal: z.object({
    fullName: z.string().min(2).max(120),
    registrationNumber: z.string().min(2).max(40),
    phone: z.string().min(5).max(30),
    email: z.string().email().max(160),
    academicYear: z.string().min(1).max(40),
    branch: z.string().min(1).max(60),
  }),
  application: z.object({
    portfolio: z.string().min(1).max(80),
    role: z.string().min(1).max(40),
    existingMember: z.union([z.boolean(), z.null()]).optional(),
    existingTeam: z.union([z.string().max(80), z.null()]).optional(),
  }),
  answers: z
    .object({
      opinion: z.string().max(2000).optional(),
      learningGoals: z.string().max(2000).optional(),
      conflictHandling: z.string().max(2000).optional(),
      initiatives: z.string().max(2000).optional(),
      leadershipExperience: z.string().max(2000).optional(),
      taskPrioritization: z.string().max(2000).optional(),
      coLeadMotivation: z.string().max(2000).optional(),
      teamExperience: z.string().max(2000).optional(),
      commitment: z.string().max(2000).optional(),
    })
    .default({}),
  photo: z.object({
    googleDriveUrl: z.string().max(500).default(''),
  }),
  userAgent: z.string().max(500).optional(),
});

function generateApplicationId(): string {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `${APPLICATION_ID_PREFIX}-${n}`;
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

  const app = getAdminApp();
  if (!app) {
    return res.status(503).json({
      ok: false,
      error:
        'Server is not configured. Set FIREBASE_SERVICE_ACCOUNT, GMAIL_USER, and GMAIL_APP_PASSWORD on Vercel.',
    });
  }

  const body = readBody(req);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid application payload.',
    });
  }

  const data = parsed.data;
  const applicationId = generateApplicationId();
  const now = Date.now();
  const doc = {
    applicationId,
    submittedAt: now,
    updatedAt: now,
    status: 'submitted' as const,
    emailStatus: 'pending' as const,
    emailError: null as string | null,
    lastEmailAttemptAt: null as number | null,
    personal: {
      fullName: data.personal.fullName.trim(),
      registrationNumber: data.personal.registrationNumber.toUpperCase().replace(/\s+/g, ''),
      phone: data.personal.phone.trim(),
      email: data.personal.email.toLowerCase().trim(),
      academicYear: data.personal.academicYear,
      branch: data.personal.branch,
    },
    application: {
      portfolio: data.application.portfolio,
      role: data.application.role,
      existingMember: data.application.existingMember ?? null,
      existingTeam: data.application.existingTeam ?? null,
    },
    answers: data.answers,
    photo: {
      googleDriveUrl: data.photo.googleDriveUrl.trim(),
    },
    metadata: {
      userAgent: data.userAgent ?? '',
      createdAt: now,
      updatedAt: now,
      statusChangedAt: null,
      statusChangedBy: null,
    },
    archived: false,
  };

  try {
    const firestore = getFirestoreClient();
    if (!firestore) {
      return res.status(503).json({
        ok: false,
        error: 'Firestore admin is not configured. Set FIREBASE_SERVICE_ACCOUNT on Vercel.',
      });
    }
    const ref = await firestore.collection('applications').add(doc);

    let emailStatus: 'sent' | 'failed' = 'sent';
    let emailError: string | null = null;
    try {
      await sendConfirmationEmail({
        applicationId,
        fullName: doc.personal.fullName,
        registrationNumber: doc.personal.registrationNumber,
        email: doc.personal.email,
        phone: doc.personal.phone,
        academicYear: doc.personal.academicYear,
        branch: doc.personal.branch,
        portfolio: doc.application.portfolio,
        role: doc.application.role,
        existingMember: doc.application.existingMember,
        existingTeam: doc.application.existingTeam,
      });
    } catch (err) {
      emailStatus = 'failed';
      emailError = err instanceof Error ? err.message : 'Failed to send confirmation email.';
    }

    await ref.update({
      emailStatus,
      emailError,
      lastEmailAttemptAt: Date.now(),
      updatedAt: Date.now(),
    });

    return res.status(201).json({
      ok: true,
      applicationId,
      docId: ref.id,
      emailStatus,
      emailError,
    });
  } catch (err) {
    console.error('create-application', err);
    return res.status(502).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to save application.',
    });
  }
}
