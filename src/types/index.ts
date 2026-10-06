export const PORTFOLIO = {
  MARKETING: 'MARKETING',
  CONTENT: 'CONTENT',
  CREATIVE_DESIGN: 'CREATIVE_DESIGN',
  WEB_DEVELOPER: 'WEB_DEVELOPER',
  HARDWARE: 'HARDWARE',
  SOFTWARE: 'SOFTWARE',
} as const;
export type Portfolio = (typeof PORTFOLIO)[keyof typeof PORTFOLIO];

export const ROLE = {
  MEMBER: 'MEMBER',
  CO_LEAD: 'CO_LEAD',
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const ACADEMIC_YEAR = {
  FIRST: 'FIRST',
  SECOND: 'SECOND',
  THIRD: 'THIRD',
  FOURTH: 'FOURTH',
  OTHER: 'OTHER',
} as const;
export type AcademicYear = (typeof ACADEMIC_YEAR)[keyof typeof ACADEMIC_YEAR];

export const BRANCH = {
  CSE: 'CSE',
  CSE_AIML: 'CSE_AIML',
  CSE_DS: 'CSE_DS',
  CSE_CS: 'CSE_CS',
  ECE: 'ECE',
  ECE_VLSI: 'ECE_VLSI',
  EECE: 'EECE',
  MECHANICAL: 'MECHANICAL',
  MECHANICAL_ROBOTICS: 'MECHANICAL_ROBOTICS',
  AEROSPACE: 'AEROSPACE',
  CIVIL: 'CIVIL',
  OTHER: 'OTHER',
} as const;
export type Branch = (typeof BRANCH)[keyof typeof BRANCH];

export const EXISTING_TEAM = {
  MARKETING: 'MARKETING',
  CONTENT: 'CONTENT',
  CREATIVE_DESIGN: 'CREATIVE_DESIGN',
  HARDWARE: 'HARDWARE',
  SOFTWARE: 'SOFTWARE',
} as const;
export type ExistingTeam = (typeof EXISTING_TEAM)[keyof typeof EXISTING_TEAM];

export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected',
} as const;
export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'skipped',
} as const;
export type EmailStatus = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS];

export interface PersonalDetails {
  fullName: string;
  registrationNumber: string;
  phone: string;
  email: string;
  academicYear: AcademicYear;
  branch: Branch;
}

export interface ApplicationMeta {
  portfolio: Portfolio;
  role: Role;
  existingMember: boolean | null;
  existingTeam: ExistingTeam | null;
}

export interface ApplicationAnswers {
  opinion: string;
  learningGoals: string;
  conflictHandling: string;
  initiatives: string;
  leadershipExperience: string;
  taskPrioritization: string;
  coLeadMotivation: string;
  teamExperience: string;
  commitment: string;
}

export interface PhotoInfo {
  googleDriveUrl: string;
}

export type ApplicationAnswersInput = Partial<ApplicationAnswers>;

export interface ApplicantPayload {
  personal: PersonalDetails;
  application: ApplicationMeta;
  answers: ApplicationAnswersInput;
  photo: PhotoInfo;
}

export interface ApplicationDocument extends ApplicantPayload {
  id: string;
  applicationId: string;
  submittedAt: number;
  updatedAt: number;
  status: ApplicationStatus;
  emailStatus: EmailStatus;
  emailError?: string | null;
  lastEmailAttemptAt?: number | null;
  metadata: {
    userAgent: string;
    createdAt: number;
    updatedAt: number;
    statusChangedAt?: number | null;
    statusChangedBy?: string | null;
  };
  archived?: boolean;
}

export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isAuthorized: boolean;
}

export interface RecruitmentSettings {
  clubName: string;
  department: string;
  university: string;
  recruitmentYear: number;
  authorizedAdminEmails: string[];
  applicationStatusOptions: ApplicationStatus[];
}

export interface ApplicationStats {
  total: number;
  members: number;
  coLeads: number;
  existingMembers: number;
  newApplicants: number;
  byPortfolio: Record<Portfolio, number>;
  byAcademicYear: Record<AcademicYear, number>;
  byBranch: Record<Branch, number>;
  byStatus: Record<ApplicationStatus, number>;
  byRole: Record<Role, number>;
  byDate: { date: string; count: number }[];
}

export type StepId =
  | 'personal'
  | 'portfolio'
  | 'role'
  | 'questions'
  | 'photo'
  | 'review'
  | 'success';
