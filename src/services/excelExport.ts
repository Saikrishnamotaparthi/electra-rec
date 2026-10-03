import * as XLSX from 'xlsx';
import type { ApplicationDocument, Portfolio } from '@/types';
import {
  ACADEMIC_YEAR_LABELS,
  BRANCH_LABELS,
  EXISTING_TEAM_LABELS,
  PORTFOLIO_LABELS,
  PORTFOLIO_ORDER,
  PORTFOLIO_SHORT_LABELS,
  RECRUITMENT_YEAR,
  ROLE_LABELS,
  STATUS_LABELS,
} from '@/constants';
import { formatDateTime } from '@/utils';

type Row = Record<string, string | number>;

function answerOrDash(value: string | null | undefined): string {
  if (!value || !value.trim()) return '—';
  return value.trim();
}

export function toExportRow(app: ApplicationDocument): Row {
  return {
    'Application ID': app.applicationId,
    'Full Name': app.personal.fullName,
    'Registration Number': app.personal.registrationNumber,
    Email: app.personal.email,
    Phone: app.personal.phone,
    'Academic Year': ACADEMIC_YEAR_LABELS[app.personal.academicYear] ?? app.personal.academicYear,
    Branch: BRANCH_LABELS[app.personal.branch] ?? app.personal.branch,
    Portfolio: PORTFOLIO_LABELS[app.application.portfolio] ?? app.application.portfolio,
    Role: ROLE_LABELS[app.application.role] ?? app.application.role,
    'Existing G-ELECTRA Member':
      app.application.existingMember === true
        ? 'Yes'
        : app.application.existingMember === false
          ? 'No'
          : '—',
    'Existing Team': app.application.existingTeam
      ? EXISTING_TEAM_LABELS[app.application.existingTeam] ?? app.application.existingTeam
      : '—',
    Opinion: answerOrDash(app.answers.opinion),
    'Learning Goals': answerOrDash(app.answers.learningGoals),
    'Conflict Handling': answerOrDash(app.answers.conflictHandling),
    Initiatives: answerOrDash(app.answers.initiatives),
    'Leadership Experience': answerOrDash(app.answers.leadershipExperience),
    'Task Prioritization': answerOrDash(app.answers.taskPrioritization),
    'Co-Lead Motivation': answerOrDash(app.answers.coLeadMotivation),
    'Team Experience': answerOrDash(app.answers.teamExperience),
    Commitment: answerOrDash(app.answers.commitment),
    'Photo Link': answerOrDash(app.photo.googleDriveUrl),
    Status: STATUS_LABELS[app.status] ?? app.status,
    'Submitted At': formatDateTime(app.submittedAt),
  };
}

function writeSheet(wb: XLSX.WorkBook, sheetName: string, apps: ApplicationDocument[]): void {
  const rows = apps.map(toExportRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0] ?? toExportRow({
    id: '',
    applicationId: '',
    submittedAt: 0,
    updatedAt: 0,
    status: 'submitted',
    emailStatus: 'pending',
    personal: {
      fullName: '',
      registrationNumber: '',
      phone: '',
      email: '',
      academicYear: 'OTHER',
      branch: 'OTHER',
    },
    application: {
      portfolio: 'MARKETING',
      role: 'MEMBER',
      existingMember: null,
      existingTeam: null,
    },
    answers: {
      opinion: '',
      learningGoals: '',
      conflictHandling: '',
      initiatives: '',
      leadershipExperience: '',
      taskPrioritization: '',
      coLeadMotivation: '',
      teamExperience: '',
      commitment: '',
    },
    photo: { googleDriveUrl: '' },
    metadata: { userAgent: '', createdAt: 0, updatedAt: 0 },
    archived: false,
  }));
  ws['!cols'] = headers.map((h) => ({ wch: Math.min(42, Math.max(14, h.length + 4)) }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename);
}

export function exportAllApplications(apps: ApplicationDocument[]): void {
  const wb = XLSX.utils.book_new();
  writeSheet(wb, 'All Applications', apps);
  for (const portfolio of PORTFOLIO_ORDER) {
    const subset = apps.filter((a) => a.application.portfolio === portfolio);
    writeSheet(wb, PORTFOLIO_SHORT_LABELS[portfolio], subset);
  }
  downloadWorkbook(wb, `G-ELECTRA-Recruitment-${RECRUITMENT_YEAR}.xlsx`);
}

export function exportDomain(apps: ApplicationDocument[], portfolio: Portfolio): void {
  const wb = XLSX.utils.book_new();
  const subset = apps.filter((a) => a.application.portfolio === portfolio);
  writeSheet(wb, PORTFOLIO_SHORT_LABELS[portfolio], subset);
  downloadWorkbook(wb, `G-ELECTRA-${PORTFOLIO_SHORT_LABELS[portfolio]}-${RECRUITMENT_YEAR}.xlsx`);
}

export function exportFiltered(apps: ApplicationDocument[]): void {
  const wb = XLSX.utils.book_new();
  writeSheet(wb, 'Filtered Applications', apps);
  downloadWorkbook(wb, `G-ELECTRA-Filtered-${RECRUITMENT_YEAR}.xlsx`);
}
