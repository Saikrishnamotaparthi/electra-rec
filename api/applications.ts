import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminApp, getFirestoreClient } from '../server/firebaseAdmin.js';
import { sendConfirmationEmail } from '../server/mailer.js';

const APPLICATION_ID_PREFIX = 'GE26';

// `WEB_DEVELOPER` remains a valid stored value for historical applications but is
// no longer open for new submissions.
const CLOSED_PORTFOLIOS = new Set(['WEB_DEVELOPER']);

// Mirrors src/schemas/application.ts — kept local so this route has no build-time
// dependency on the React app's path aliases.
const REGISTRATION_NUMBER_REGEX = /^\d{10}$/;
const CONTACT_NUMBER_REGEX = /^\d{10}$/;
const GITAM_EMAIL_REGEX = /^[^\s@]+@(gitam\.edu|student\.gitam\.edu)$/;

const personalSchema = z.object({
  fullName: z.string().min(2).max(120),
  registrationNumber: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase().replace(/\s+/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Registration number is required')
        .regex(REGISTRATION_NUMBER_REGEX, 'Registration number must be exactly 10 digits'),
    ),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Contact number is required')
        .regex(CONTACT_NUMBER_REGEX, 'Contact number must be exactly 10 digits'),
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z
        .string()
        .min(1, 'Email is required')
        .regex(
          GITAM_EMAIL_REGEX,
          'Use your official GITAM email (@gitam.edu or @student.gitam.edu)',
        ),
    ),
  academicYear: z.string().min(1).max(40),
  branch: z.string().min(1).max(60),
});

const payloadSchema = z.object({
  personal: personalSchema,
  application: z.object({
    portfolio: z
      .string()
      .min(1)
      .max(80)
      .refine((value) => !CLOSED_PORTFOLIOS.has(value), {
        message: 'This portfolio is no longer accepting applications.',
      }),
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
        'Firestore admin is not configured. Set FIREBASE_SERVICE_ACCOUNT on Vercel as a single-line JSON value (Settings > Environment Variables), then redeploy.',
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

    try {
      await ref.update({
        emailStatus,
        emailError,
        lastEmailAttemptAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err) {
      // Application is already stored and the email was already attempted.
      // Report success so the client does not retry and create a duplicate.
      console.error('create-application: stored but status update failed', err);
    }

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
