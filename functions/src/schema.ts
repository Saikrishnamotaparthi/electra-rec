import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared validation helpers (mirrors the frontend schemas)
// ---------------------------------------------------------------------------

const phoneRegex = /^\d{10}$/;
const registrationRegex = /^\d{10}$/;
const gitamEmailRegex = /^[^\s@]+@(gitam\.edu|student\.gitam\.edu)$/;

const academicYearEnum = z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'OTHER']);
const branchEnum = z.enum([
  'CSE',
  'CSE_AIML',
  'CSE_DS',
  'CSE_CS',
  'ECE', 'ECE_VLSI', 'EECE', 'MECHANICAL', 'MECHANICAL_ROBOTICS', 'AEROSPACE', 'CIVIL', 'OTHER',
]);
// `WEB_DEVELOPER` is intentionally not accepted for new submissions; it stays a
// valid stored value so historical applications keep rendering in admin views.
const portfolioEnum = z.enum([
  'MARKETING', 'CONTENT', 'CREATIVE_DESIGN', 'HARDWARE', 'SOFTWARE',
]);
const roleEnum = z.enum(['MEMBER', 'CO_LEAD']);
const existingTeamEnum = z.enum([
  'MARKETING', 'CONTENT', 'CREATIVE_DESIGN', 'HARDWARE', 'SOFTWARE',
]);

const personalSchema = z.object({
  fullName: z.string().trim().min(1, 'This field is required').max(100, 'Name must be 100 characters or fewer'),
  registrationNumber: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase().replace(/\s+/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Registration number is required')
        .regex(registrationRegex, 'Registration number must be exactly 10 digits'),
    ),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Contact number is required')
        .regex(phoneRegex, 'Contact number must be exactly 10 digits'),
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
          gitamEmailRegex,
          'Use your official GITAM email (@gitam.edu or @student.gitam.edu)',
        ),
    ),
  academicYear: academicYearEnum,
  branch: branchEnum,
});

const applicationSchema = z.object({
  portfolio: portfolioEnum,
  role: roleEnum,
  existingMember: z.union([z.boolean(), z.null()]),
  existingTeam: z.union([existingTeamEnum, z.null()]),
});

const answersSchema = z.object({
  opinion: z.string().max(2000).optional().default(''),
  learningGoals: z.string().max(2000).optional().default(''),
  conflictHandling: z.string().max(2000).optional().default(''),
  initiatives: z.string().max(2000).optional().default(''),
  leadershipExperience: z.string().max(2000).optional().default(''),
  taskPrioritization: z.string().max(2000).optional().default(''),
  coLeadMotivation: z.string().max(2000).optional().default(''),
  teamExperience: z.string().max(2000).optional().default(''),
  commitment: z.string().max(2000).optional().default(''),
});

const photoSchema = z.object({
  googleDriveUrl: z.string().trim().refine(
    (v) =>
      v.length > 0 &&
      /^(https:\/\/(drive\.google\.com|docs\.google\.com|drive\.usercontent\.google\.com)\/)/.test(v),
    'Provide a valid Google Drive share link',
  ),
});

export const submitApplicationSchema = z.object({
  personal: personalSchema,
  application: applicationSchema,
  answers: answersSchema,
  photo: photoSchema,
});

export type SubmitApplicationPayload = z.infer<typeof submitApplicationSchema>;

export function isGoogleDriveUrl(url: string): boolean {
  return /^(https:\/\/(drive\.google\.com|docs\.google\.com|drive\.usercontent\.google\.com)\/)/.test(url);
}
