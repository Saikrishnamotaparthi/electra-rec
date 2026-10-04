import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import nodemailer from 'nodemailer';
import { submitApplicationSchema, type SubmitApplicationPayload } from './schema';
import { renderConfirmationEmail, renderStatusUpdateEmail } from './email/templates';

initializeApp();
const db = getFirestore();

const GMAIL_USER = defineSecret('GMAIL_USER');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

const APPLICATION_ID_PREFIX = 'GE26';
const ADMIN_EMAILS = ['hello@dotfreelancer.in', 'gelectra@gitam.edu'];

const PORTFOLIO_LABELS: Record<string, string> = {
  MARKETING: 'Marketing Team',
  CONTENT: 'Content Team',
  CREATIVE_DESIGN: 'Creative Design Team',
  WEB_DEVELOPER: 'Web Developer',
  HARDWARE: 'Prototype Makers – Hardware',
  SOFTWARE: 'Prototype Makers – Software',
};

const ROLE_LABELS: Record<string, string> = {
  MEMBER: 'Member',
  CO_LEAD: 'Co-Lead',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeRegNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

async function generateApplicationId(): Promise<string> {
  const counterRef = db.doc('counters/applicationIds');
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists ? Number(snap.get('value') ?? 0) : 0;
    const next = current + 1;
    tx.set(counterRef, { value: next }, { merge: true });
    const suffix = String(next).padStart(5, '0');
    return `${APPLICATION_ID_PREFIX}-${suffix}`;
  });
}

function getTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER.value(),
      pass: GMAIL_APP_PASSWORD.value(),
    },
  });
}

function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}

// ---------------------------------------------------------------------------
// submitApplication
// ---------------------------------------------------------------------------
export const submitApplication = onCall(
  {
    region: 'us-central1',
    secrets: [GMAIL_USER, GMAIL_APP_PASSWORD],
    cors: true,
  },
  async (request) => {
    const parsed = submitApplicationSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid application data');
    }
    const payload: SubmitApplicationPayload = parsed.data;

    const reg = normalizeRegNumber(payload.personal.registrationNumber);
    const email = normalizeEmail(payload.personal.email);

    const existing = await db
      .collection('applications')
      .where('personal.registrationNumber', '==', reg)
      .where('archived', '==', false)
      .limit(1)
      .get();
    if (!existing.empty) {
      throw new HttpsError('already-exists', 'An application with this registration number already exists.');
    }

    const existingEmail = await db
      .collection('applications')
      .where('personal.email', '==', email)
      .where('archived', '==', false)
      .limit(1)
      .get();
    if (!existingEmail.empty) {
      throw new HttpsError('already-exists', 'An application with this email address already exists.');
    }

    const applicationId = await generateApplicationId();
    const now = Date.now();
    const userAgent = String(request.rawRequest.headers['user-agent'] ?? '');

    const docRef = db.collection('applications').doc();
    const document = {
      applicationId,
      submittedAt: now,
      updatedAt: now,
      status: 'submitted',
      emailStatus: 'pending',
      emailError: null,
      lastEmailAttemptAt: null,
      personal: {
        fullName: payload.personal.fullName,
        registrationNumber: reg,
        phone: payload.personal.phone,
        email,
        academicYear: payload.personal.academicYear,
        branch: payload.personal.branch,
      },
      application: {
        portfolio: payload.application.portfolio,
        role: payload.application.role,
        existingMember: payload.application.existingMember,
        existingTeam: payload.application.existingTeam,
      },
      answers: {
        opinion: payload.answers.opinion ?? '',
        learningGoals: payload.answers.learningGoals ?? '',
        conflictHandling: payload.answers.conflictHandling ?? '',
        initiatives: payload.answers.initiatives ?? '',
        leadershipExperience: payload.answers.leadershipExperience ?? '',
        taskPrioritization: payload.answers.taskPrioritization ?? '',
        coLeadMotivation: payload.answers.coLeadMotivation ?? '',
        teamExperience: payload.answers.teamExperience ?? '',
        commitment: payload.answers.commitment ?? '',
      },
      photo: { googleDriveUrl: payload.photo.googleDriveUrl },
      metadata: {
        userAgent,
        createdAt: now,
        updatedAt: now,
        statusChangedAt: null,
        statusChangedBy: null,
      },
      archived: false,
    };

    await docRef.set(document);

    // Send confirmation email. Delivery and status bookkeeping are tracked
    // separately so a Firestore write failure never hides a delivered email.
    let emailStatus = 'sent';
    let emailError: string | null = null;
    let messageId = '';
    try {
      const transport = getTransport();
      const info = await transport.sendMail({
        from: `"G-ELECTRA Recruitment" <${GMAIL_USER.value()}>`,
        to: email,
        subject: `Your G-ELECTRA application has been received (${applicationId})`,
        html: renderConfirmationEmail({
          fullName: payload.personal.fullName,
          applicationId,
          portfolioLabel: PORTFOLIO_LABELS[payload.application.portfolio] ?? payload.application.portfolio,
          roleLabel: ROLE_LABELS[payload.application.role] ?? payload.application.role,
          email,
        }),
      });
      messageId = info.messageId;
    } catch (err) {
      emailStatus = 'failed';
      emailError = err instanceof Error ? err.message : 'Email delivery failed';
    }

    try {
      await docRef.update({ emailStatus, emailError, lastEmailAttemptAt: Date.now() });
    } catch (err) {
      console.error('submitApplication: stored but email status update failed', {
        docId: docRef.id,
        applicationId,
        emailStatus,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    return { ok: true, docId: docRef.id, applicationId, emailStatus, messageId };
  },
);

// ---------------------------------------------------------------------------
// resendConfirmationEmail
// ---------------------------------------------------------------------------
export const resendConfirmationEmail = onCall(
  {
    region: 'us-central1',
    secrets: [GMAIL_USER, GMAIL_APP_PASSWORD],
    cors: true,
  },
  async (request) => {
    const docId = String(request.data?.docId ?? '');
    if (!docId) {
      throw new HttpsError('invalid-argument', 'docId is required');
    }

    const docRef = db.collection('applications').doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Application not found');
    }
    const data = snap.data()!;

    // Admin-only, or the applicant resubmitting via their own flow
    const callerEmail = normalizeEmail(request.auth?.token?.email ?? '');
    const isOwner = callerEmail === normalizeEmail(data.personal?.email ?? '');
    if (!isAuthorizedAdminEmail(callerEmail) && !isOwner) {
      throw new HttpsError('permission-denied', 'Not authorized to resend this email');
    }

    try {
      const transport = getTransport();
      const info = await transport.sendMail({
        from: `"G-ELECTRA Recruitment" <${GMAIL_USER.value()}>`,
        to: data.personal.email,
        subject: `Your G-ELECTRA application has been received (${data.applicationId})`,
        html: renderConfirmationEmail({
          fullName: data.personal.fullName,
          applicationId: data.applicationId,
          portfolioLabel: PORTFOLIO_LABELS[data.application?.portfolio] ?? data.application?.portfolio ?? '',
          roleLabel: ROLE_LABELS[data.application?.role] ?? data.application?.role ?? '',
          email: data.personal.email,
        }),
      });
      try {
        await docRef.update({ emailStatus: 'sent', emailError: null, lastEmailAttemptAt: Date.now() });
      } catch (err) {
        console.error('resendConfirmationEmail: delivered but status update failed', {
          docId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
      return { ok: true, messageId: info.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email delivery failed';
      try {
        await docRef.update({ emailStatus: 'failed', emailError: message, lastEmailAttemptAt: Date.now() });
      } catch (statusErr) {
        console.error('resendConfirmationEmail: delivery failed and status update failed', {
          docId,
          deliveryError: message,
          error: statusErr instanceof Error ? statusErr.message : 'Unknown error',
        });
      }
      throw new HttpsError('internal', message);
    }
  },
);

// ---------------------------------------------------------------------------
// updateApplicationStatus
// ---------------------------------------------------------------------------
export const updateApplicationStatus = onCall(
  { region: 'us-central1', cors: true },
  async (request) => {
    const callerEmail = normalizeEmail(request.auth?.token?.email ?? '');
    if (!isAuthorizedAdminEmail(callerEmail)) {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const docId = String(request.data?.docId ?? '');
    const status = String(request.data?.status ?? '');
    const allowed = ['submitted', 'reviewed', 'shortlisted', 'rejected'];
    if (!docId || !allowed.includes(status)) {
      throw new HttpsError('invalid-argument', 'docId and a valid status are required');
    }

    const docRef = db.collection('applications').doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Application not found');
    }

    const now = Date.now();
    await docRef.update({
      status,
      updatedAt: now,
      'metadata.statusChangedAt': now,
      'metadata.statusChangedBy': callerEmail,
    });

    // Best-effort status notification to the applicant
    try {
      const data = snap.data()!;
      const transport = getTransport();
      await transport.sendMail({
        from: `"G-ELECTRA Recruitment" <${GMAIL_USER.value()}>`,
        to: data.personal.email,
        subject: `G-ELECTRA application update — ${STATUS_LABELS[status] ?? status}`,
        html: renderStatusUpdateEmail({
          fullName: data.personal.fullName,
          applicationId: data.applicationId,
          status: STATUS_LABELS[status] ?? status,
        }),
      });
      await docRef.update({ emailStatus: 'sent', emailError: null, lastEmailAttemptAt: Date.now() });
    } catch (err) {
      // Non-fatal: status is already updated
      console.error('updateApplicationStatus: status notification failed', {
        docId,
        status,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    return { ok: true };
  },
);

// ---------------------------------------------------------------------------
// getRecruitmentStats
// ---------------------------------------------------------------------------
export const getRecruitmentStats = onCall({ region: 'us-central1', cors: true }, async (request) => {
  const callerEmail = normalizeEmail(request.auth?.token?.email ?? '');
  if (!isAuthorizedAdminEmail(callerEmail)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const snap = await db
    .collection('applications')
    .where('archived', '==', false)
    .get();

  let total = 0;
  let members = 0;
  let coLeads = 0;
  let existingMembers = 0;
  let newApplicants = 0;
  const byPortfolio: Record<string, number> = {};
  const byStatus: Record<string, number> = {
    submitted: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0,
  };

  snap.docs.forEach((d) => {
    const data = d.data();
    total += 1;
    const role = data.application?.role;
    const portfolio = data.application?.portfolio;
    const status = data.status ?? 'submitted';
    if (role === 'MEMBER') members += 1;
    if (role === 'CO_LEAD') coLeads += 1;
    if (data.application?.existingMember === true) existingMembers += 1;
    else newApplicants += 1;
    if (portfolio) byPortfolio[portfolio] = (byPortfolio[portfolio] ?? 0) + 1;
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  });

  return { ok: true, stats: { total, members, coLeads, existingMembers, newApplicants, byPortfolio, byStatus } };
});

void FieldValue;
