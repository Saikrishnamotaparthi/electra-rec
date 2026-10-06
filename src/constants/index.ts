import type {
  AcademicYear,
  ApplicationStatus,
  Branch,
  ExistingTeam,
  Portfolio,
  RecruitmentSettings,
  Role,
} from '@/types';

export const CLUB_NAME = 'G-ELECTRA';
export const CLUB_TAGLINE = 'Smart Systems Club';
export const DEPARTMENT = 'Department of EECE';
export const UNIVERSITY = 'GITAM University – Hyderabad';
export const RECRUITMENT_YEAR = 2026;
export const APPLICATION_ID_PREFIX = 'GE26';

export const LOGO_PATH = '/logo.png';
export const LOGO_ALT = 'G-ELECTRA Smart Systems Club logo';

export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/G2KLWd47k8D8ADBq1TsZiy';
export const WHATSAPP_GROUP_LABEL = 'Join our WhatsApp group';

export const PORTFOLIO_LABELS: Record<Portfolio, string> = {
  MARKETING: 'Marketing Team',
  CONTENT: 'Content Team',
  CREATIVE_DESIGN: 'Creative Design Team',
  WEB_DEVELOPER: 'Web Developer',
  HARDWARE: 'Prototype Makers – Hardware',
  SOFTWARE: 'Prototype Makers – Software',
};

export const PORTFOLIO_SHORT_LABELS: Record<Portfolio, string> = {
  MARKETING: 'Marketing',
  CONTENT: 'Content',
  CREATIVE_DESIGN: 'Creative Design',
  WEB_DEVELOPER: 'Web Development',
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
};

export const PORTFOLIO_DESCRIPTIONS: Record<Portfolio, string> = {
  MARKETING:
    "This team drives G-Electra's outreach efforts through campaign planning, promotional content, social media management and brand representation.",
  CONTENT:
    'This team focuses on written content, event reporting, documentation, editing and communication.',
  CREATIVE_DESIGN:
    'This team creates visual content such as posters, banners, branding assets, event creatives and reels.',
  WEB_DEVELOPER:
    "This team develops and maintains G-Electra's digital platforms, including website development, UI/UX and SEO.",
  HARDWARE:
    'This team designs and develops hardware systems for IoT, robotics and technology projects.',
  SOFTWARE:
    'This team develops software prototypes, applications and integrations for G-Electra projects.',
};

export const PORTFOLIO_ORDER: Portfolio[] = [
  'MARKETING',
  'CONTENT',
  'CREATIVE_DESIGN',
  'WEB_DEVELOPER',
  'HARDWARE',
  'SOFTWARE',
];

/**
 * Portfolios offered for new submissions.
 * `WEB_DEVELOPER` is intentionally excluded: it stays in `PORTFOLIO_ORDER`,
 * labels and schemas so historical applications keep rendering correctly in
 * admin views, analytics and exports.
 */
export type SelectablePortfolio = Exclude<Portfolio, 'WEB_DEVELOPER'>;

export const PORTFOLIO_SELECTABLE: SelectablePortfolio[] = PORTFOLIO_ORDER.filter(
  (p): p is SelectablePortfolio => p !== 'WEB_DEVELOPER',
);

export const ROLE_LABELS: Record<Role, string> = {
  MEMBER: 'Member',
  CO_LEAD: 'Co-Lead',
};

export const ACADEMIC_YEAR_LABELS: Record<AcademicYear, string> = {
  FIRST: '1st Year',
  SECOND: '2nd Year',
  THIRD: '3rd Year',
  FOURTH: '4th Year',
  OTHER: 'Other',
};

export const BRANCH_LABELS: Record<Branch, string> = {
  CSE: 'CSE',
  CSE_AIML: 'CSE [AI & ML]',
  CSE_DS: 'CSE [Data Science]',
  CSE_CS: 'CSE [Cyber Security]',
  ECE: 'ECE',
  ECE_VLSI: 'ECE [VLSI]',
  EECE: 'EECE',
  MECHANICAL: 'Mechanical',
  MECHANICAL_ROBOTICS: 'Mechanical [Robotics]',
  AEROSPACE: 'Aerospace',
  CIVIL: 'Civil',
  OTHER: 'Other',
};

export const EXISTING_TEAM_LABELS: Record<ExistingTeam, string> = {
  MARKETING: 'Marketing Team',
  CONTENT: 'Content Team',
  CREATIVE_DESIGN: 'Creative Design Team',
  HARDWARE: 'Hardware Team',
  SOFTWARE: 'Software Team',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
};

export const STATUS_ORDER: ApplicationStatus[] = [
  'submitted',
  'reviewed',
  'shortlisted',
  'rejected',
];

/**
 * Built-in administrators. These accounts always work as admins (client,
 * Firestore rules, and API). Additional admins can be managed at runtime
 * from Admin → Settings (stored in Firestore `admin_config/list`).
 */
export const SEED_ADMIN_EMAILS = ['hello@dotfreelancer.in', 'gelectra@gitam.edu'] as const;

export const DEFAULT_SETTINGS: RecruitmentSettings = {
  clubName: CLUB_NAME,
  department: DEPARTMENT,
  university: UNIVERSITY,
  recruitmentYear: RECRUITMENT_YEAR,
  authorizedAdminEmails: [...SEED_ADMIN_EMAILS],
  applicationStatusOptions: STATUS_ORDER,
};

export const HERO = {
  headline: 'JOIN TEAM G-ELECTRA',
  supporting: 'Are you passionate about electronics, innovation, and smart systems?',
  body: 'This is your opportunity to become part of a technology-driven student community where you can build projects, develop skills, work with teams and contribute to exciting events and initiatives.',
};

export const WHY_JOIN = [
  {
    title: 'Build Real Systems',
    body: 'From circuit boards to full-stack platforms, ship prototypes that solve real problems.',
  },
  {
    title: 'Learn by Doing',
    body: 'Workshops, hands-on projects and mentoring from seniors across electronics and software.',
  },
  {
    title: 'Community & Events',
    body: 'Join hackathons, tech fests, demos and campus-wide innovation initiatives.',
  },
  {
    title: 'Career Signal',
    body: 'A serious tech club experience that strengthens portfolios, interviews and industry readiness.',
  },
];

export const RECRUITMENT_PROCESS = [
  { step: '01', title: 'Submit Application', body: 'Fill the recruitment form with your details, portfolio and goals.' },
  { step: '02', title: 'Application Review', body: 'The G-ELECTRA team reviews every application carefully.' },
  { step: '03', title: 'Shortlisting', body: 'Selected applicants move to the next stage of the recruitment process.' },
  { step: '04', title: 'Interaction / Selection', body: 'Interaction round(s) and final team assignment.' },
];

export const FAQS = [
  {
    q: 'Who can apply?',
    a: 'Any GITAM Hyderabad student interested in G-ELECTRA can apply, regardless of branch or year, as long as you meet the academic year options listed in the form.',
  },
  {
    q: 'Can I select multiple portfolios?',
    a: 'No. You must select only one portfolio/team that best matches your interest and strengths.',
  },
  {
    q: 'Can I apply as a Co-Lead?',
    a: 'Yes. Choose “Co-Lead” in the role step. You will be asked whether you are an existing G-ELECTRA member.',
  },
  {
    q: 'Can non-members apply for Co-Lead?',
    a: 'Yes. Non-members applying for Co-Lead complete a set of leadership and motivation questions.',
  },
  {
    q: 'Will I receive a confirmation?',
    a: 'Yes. Every successful submission receives a confirmation email at your registered GITAM email.',
  },
  {
    q: 'What happens after submission?',
    a: 'The recruitment team reviews applications, shortlists candidates and communicates next steps through your registered email.',
  },
];
