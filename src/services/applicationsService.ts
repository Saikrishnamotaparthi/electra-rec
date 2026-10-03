import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type {
  ApplicationDocument,
  ApplicationStatus,
  ApplicationStats,
  ApplicantPayload,
  Portfolio,
  Role,
} from '@/types';
import { APPLICATION_ID_PREFIX, PORTFOLIO_ORDER } from '@/constants';
import { normalizeEmail, normalizeRegNumber } from '@/utils';
import { createApplicationViaApi, sendApplicationConfirmation } from '@/services/emailApi';

const COLLECTION = 'applications';

function generateApplicationId(): string {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `${APPLICATION_ID_PREFIX}-${n}`;
}

function mapDoc(id: string, data: DocumentData): ApplicationDocument {
  return {
    id,
    applicationId: (data.applicationId as string) ?? id,
    submittedAt: (data.submittedAt as number) ?? Date.now(),
    updatedAt: (data.updatedAt as number) ?? Date.now(),
    status: (data.status as ApplicationStatus) ?? 'submitted',
    emailStatus: data.emailStatus ?? 'pending',
    emailError: data.emailError ?? null,
    lastEmailAttemptAt: data.lastEmailAttemptAt ?? null,
    personal: {
      fullName: data.personal?.fullName ?? '',
      registrationNumber: data.personal?.registrationNumber ?? '',
      phone: data.personal?.phone ?? '',
      email: data.personal?.email ?? '',
      academicYear: data.personal?.academicYear ?? 'OTHER',
      branch: data.personal?.branch ?? 'OTHER',
    },
    application: {
      portfolio: data.application?.portfolio ?? 'MARKETING',
      role: data.application?.role ?? 'MEMBER',
      existingMember: data.application?.existingMember ?? null,
      existingTeam: data.application?.existingTeam ?? null,
    },
    answers: {
      opinion: data.answers?.opinion ?? '',
      learningGoals: data.answers?.learningGoals ?? '',
      conflictHandling: data.answers?.conflictHandling ?? '',
      initiatives: data.answers?.initiatives ?? '',
      leadershipExperience: data.answers?.leadershipExperience ?? '',
      taskPrioritization: data.answers?.taskPrioritization ?? '',
      coLeadMotivation: data.answers?.coLeadMotivation ?? '',
      teamExperience: data.answers?.teamExperience ?? '',
      commitment: data.answers?.commitment ?? '',
    },
    photo: {
      googleDriveUrl: data.photo?.googleDriveUrl ?? '',
    },
    metadata: {
      userAgent: data.metadata?.userAgent ?? '',
      createdAt: data.metadata?.createdAt ?? Date.now(),
      updatedAt: data.metadata?.updatedAt ?? Date.now(),
      statusChangedAt: data.metadata?.statusChangedAt ?? null,
      statusChangedBy: data.metadata?.statusChangedBy ?? null,
    },
    archived: Boolean(data.archived),
  };
}

export interface ListFilters {
  search?: string;
  portfolio?: Portfolio | 'ALL';
  role?: Role | 'ALL';
  status?: ApplicationStatus | 'ALL';
  academicYear?: string;
  branch?: string;
  existingMember?: 'true' | 'false' | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}

export async function listApplications(
  filters: ListFilters = {},
): Promise<{ items: ApplicationDocument[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null }> {
  if (!db) throw new Error('Recruitment service is unavailable.');

  const constraints: QueryConstraint[] = [];
  constraints.push(where('archived', '==', false));

  if (filters.portfolio && filters.portfolio !== 'ALL') {
    constraints.push(where('application.portfolio', '==', filters.portfolio));
  }
  if (filters.role && filters.role !== 'ALL') {
    constraints.push(where('application.role', '==', filters.role));
  }
  if (filters.status && filters.status !== 'ALL') {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.academicYear && filters.academicYear !== 'ALL') {
    constraints.push(where('personal.academicYear', '==', filters.academicYear));
  }
  if (filters.branch && filters.branch !== 'ALL') {
    constraints.push(where('personal.branch', '==', filters.branch));
  }
  if (filters.existingMember && filters.existingMember !== 'ALL') {
    constraints.push(where('application.existingMember', '==', filters.existingMember === 'true'));
  }
  if (filters.dateFrom) {
    constraints.push(where('submittedAt', '>=', new Date(filters.dateFrom).setHours(0, 0, 0, 0)));
  }
  if (filters.dateTo) {
    constraints.push(where('submittedAt', '<=', new Date(filters.dateTo).setHours(23, 59, 59, 999)));
  }

  constraints.push(orderBy('submittedAt', 'desc'));
  constraints.push(limit(filters.pageSize ?? 20));
  if (filters.cursor) {
    constraints.push(startAfter(filters.cursor));
  }

  const snap = await getDocs(query(collection(db, COLLECTION), ...constraints));
  const items = snap.docs.map((d) => mapDoc(d.id, d.data()));
  const nextCursor = snap.docs.length === (filters.pageSize ?? 20)
    ? snap.docs[snap.docs.length - 1]
    : null;

  // Client-side search (safe filter over the returned page + common fields)
  if (filters.search?.trim()) {
    const needle = filters.search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      return (
        item.personal.fullName.toLowerCase().includes(needle) ||
        item.personal.registrationNumber.toLowerCase().includes(needle) ||
        item.personal.email.toLowerCase().includes(needle) ||
        item.applicationId.toLowerCase().includes(needle) ||
        item.personal.phone.includes(needle)
      );
    });
    return { items: filtered, nextCursor: null };
  }

  return { items, nextCursor };
}

export async function getApplication(docId: string): Promise<ApplicationDocument | null> {
  if (!db) throw new Error('Recruitment service is unavailable.');
  const snap = await getDoc(doc(db, COLLECTION, docId));
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data());
}

export async function getApplicationByRegistration(
  registrationNumber: string,
): Promise<ApplicationDocument | null> {
  if (!db) throw new Error('Recruitment service is unavailable.');
  const reg = normalizeRegNumber(registrationNumber);
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('personal.registrationNumber', '==', reg),
      where('archived', '==', false),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  return mapDoc(snap.docs[0].id, snap.docs[0].data());
}

export async function getApplicationByEmail(
  email: string,
): Promise<ApplicationDocument | null> {
  if (!db) throw new Error('Recruitment service is unavailable.');
  const normalized = normalizeEmail(email);
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('personal.email', '==', normalized),
      where('archived', '==', false),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  return mapDoc(snap.docs[0].id, snap.docs[0].data());
}

export interface SubmitDirectResult {
  ok: boolean;
  applicationId?: string;
  docId?: string;
  emailStatus?: 'sent' | 'failed' | 'pending' | 'skipped';
  error?: string;
}

/**
 * Preferred path on Vercel: POST /api/applications creates the Firestore doc
 * and sends the confirmation email server-side, then records emailStatus.
 * Falls back to client-side Firestore write + email API when the serverless
 * create endpoint is unavailable (e.g. local Firebase-only setups).
 */
export async function submitApplicationDirect(payload: ApplicantPayload): Promise<SubmitDirectResult> {
  const serverPayload = {
    personal: {
      fullName: payload.personal.fullName,
      registrationNumber: normalizeRegNumber(payload.personal.registrationNumber),
      phone: payload.personal.phone,
      email: normalizeEmail(payload.personal.email),
      academicYear: payload.personal.academicYear,
      branch: payload.personal.branch,
    },
    application: payload.application,
    answers: payload.answers,
    photo: payload.photo,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  const apiResult = await createApplicationViaApi(serverPayload);
  if (apiResult.ok && apiResult.applicationId && apiResult.docId) {
    return {
      ok: true,
      applicationId: apiResult.applicationId,
      docId: apiResult.docId,
      emailStatus: apiResult.emailStatus ?? 'pending',
    };
  }

  // Fallback: client-side create (rules allow public create).
  if (!db) {
    return {
      ok: false,
      error:
        apiResult.error ??
        'Unable to reach the recruitment service. Please try again later.',
    };
  }
  try {
    const applicationId = generateApplicationId();
    const now = Date.now();
    const body = {
      applicationId,
      submittedAt: now,
      updatedAt: now,
      status: 'submitted' as ApplicationStatus,
      emailStatus: 'pending' as const,
      emailError: null,
      lastEmailAttemptAt: null,
      personal: serverPayload.personal,
      application: payload.application,
      answers: payload.answers,
      photo: payload.photo,
      metadata: {
        userAgent: serverPayload.userAgent,
        createdAt: now,
        updatedAt: now,
        statusChangedAt: null,
        statusChangedBy: null,
      },
      archived: false,
    };
    const ref = await addDoc(collection(db, COLLECTION), body);

    let emailStatus: 'sent' | 'failed' | 'pending' = 'pending';
    let emailError: string | null = null;
    try {
      const emailResult = await sendApplicationConfirmation({
        docId: ref.id,
        applicationId,
        fullName: serverPayload.personal.fullName,
        registrationNumber: serverPayload.personal.registrationNumber,
        email: serverPayload.personal.email,
        phone: serverPayload.personal.phone,
        academicYear: serverPayload.personal.academicYear,
        branch: serverPayload.personal.branch,
        portfolio: payload.application.portfolio,
        role: payload.application.role,
        existingMember: payload.application.existingMember,
        existingTeam: payload.application.existingTeam,
      });
      emailStatus = emailResult.ok ? 'sent' : 'failed';
      emailError = emailResult.ok ? null : (emailResult.error ?? 'Email send failed');
    } catch (err) {
      emailStatus = 'failed';
      emailError = err instanceof Error ? err.message : 'Email send failed';
    }

    try {
      await updateEmailStatus(ref.id, emailStatus, emailError);
    } catch (err) {
      console.warn('updateEmailStatus failed (rules/server?), email still attempted', err);
    }

    return { ok: true, applicationId, docId: ref.id, emailStatus };
  } catch (err) {
    console.error('submitApplicationDirect', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Submission failed. Please try again.',
    };
  }
}

export async function updateApplicationStatus(
  docId: string,
  status: ApplicationStatus,
  changedBy: string,
): Promise<void> {
  if (!db) throw new Error('Recruitment service is unavailable.');
  await updateDoc(doc(db, COLLECTION, docId), {
    status,
    updatedAt: Date.now(),
    'metadata.statusChangedAt': Date.now(),
    'metadata.statusChangedBy': changedBy,
  });
}

export async function updateEmailStatus(
  docId: string,
  emailStatus: 'sent' | 'failed' | 'pending',
  emailError: string | null,
): Promise<void> {
  if (!db) throw new Error('Recruitment service is unavailable.');
  await updateDoc(doc(db, COLLECTION, docId), {
    emailStatus,
    emailError,
    lastEmailAttemptAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function archiveApplication(docId: string): Promise<void> {
  const { updateDoc } = await import('firebase/firestore');
  if (!db) throw new Error('Recruitment service is unavailable.');
  await updateDoc(doc(db, COLLECTION, docId), {
    archived: true,
    updatedAt: Date.now(),
  });
}

export async function fetchAllForExport(): Promise<ApplicationDocument[]> {
  if (!db) throw new Error('Recruitment service is unavailable.');
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('archived', '==', false), orderBy('submittedAt', 'desc'), limit(1000)),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data()));
}

export function computeStats(apps: ApplicationDocument[]): ApplicationStats {
  const byPortfolio = Object.fromEntries(PORTFOLIO_ORDER.map((p) => [p, 0])) as ApplicationStats['byPortfolio'];
  const byAcademicYear: ApplicationStats['byAcademicYear'] = {
    FIRST: 0,
    SECOND: 0,
    THIRD: 0,
    FOURTH: 0,
    OTHER: 0,
  };
  const byBranch: ApplicationStats['byBranch'] = {
    CSE: 0,
    ECE: 0,
    ECE_VLSI: 0,
    EECE: 0,
    MECHANICAL: 0,
    MECHANICAL_ROBOTICS: 0,
    AEROSPACE: 0,
    CIVIL: 0,
    OTHER: 0,
  };
  const byStatus: ApplicationStats['byStatus'] = {
    submitted: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0,
  };
  const byRole: ApplicationStats['byRole'] = { MEMBER: 0, CO_LEAD: 0 };
  const dateMap = new Map<string, number>();

  let members = 0;
  let coLeads = 0;
  let existingMembers = 0;
  let newApplicants = 0;

  for (const app of apps) {
    byPortfolio[app.application.portfolio] = (byPortfolio[app.application.portfolio] ?? 0) + 1;
    byAcademicYear[app.personal.academicYear] = (byAcademicYear[app.personal.academicYear] ?? 0) + 1;
    byBranch[app.personal.branch] = (byBranch[app.personal.branch] ?? 0) + 1;
    byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
    byRole[app.application.role] = (byRole[app.application.role] ?? 0) + 1;

    if (app.application.role === 'MEMBER') members += 1;
    if (app.application.role === 'CO_LEAD') coLeads += 1;
    if (app.application.existingMember === true) existingMembers += 1;
    if (app.application.existingMember !== true) newApplicants += 1;

    const d = new Date(app.submittedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
  }

  const byDate = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total: apps.length,
    members,
    coLeads,
    existingMembers,
    newApplicants,
    byPortfolio,
    byAcademicYear,
    byBranch,
    byStatus,
    byRole,
    byDate,
  };
}
