import { z } from 'zod';
import {
  ACADEMIC_YEAR,
  BRANCH,
  PORTFOLIO,
  ROLE,
  EXISTING_TEAM,
} from '@/types';

// Exactly 10 digits, no letters, separators or country code.
export const REGISTRATION_NUMBER_REGEX = /^\d{10}$/;
export const CONTACT_NUMBER_REGEX = /^\d{10}$/;
// Applicants may only use an official GITAM mailbox.
export const GITAM_EMAIL_REGEX = /^[^\s@]+@(gitam\.edu|student\.gitam\.edu)$/;

export const REGISTRATION_NUMBER_ERROR = 'Registration number must be exactly 10 digits';
export const CONTACT_NUMBER_ERROR = 'Contact number must be exactly 10 digits';
export const GITAM_EMAIL_ERROR =
  'Use your official GITAM email (@gitam.edu or @student.gitam.edu)';

export const personalSchema = z.object({
  fullName: z
    .string()
    .max(100, 'Name must be 100 characters or fewer')
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, { message: 'This field is required' }),
  registrationNumber: z
    .string()
    .transform((v) => v.trim().toUpperCase().replace(/\s+/g, ''))
    .refine((v) => v.length > 0, 'Registration number is required')
    .refine((v) => REGISTRATION_NUMBER_REGEX.test(v), REGISTRATION_NUMBER_ERROR),
  phone: z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, ''))
    .refine((v) => v.length > 0, 'Contact number is required')
    .refine((v) => CONTACT_NUMBER_REGEX.test(v), CONTACT_NUMBER_ERROR),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v.length > 0, 'Email is required')
    .refine((v) => GITAM_EMAIL_REGEX.test(v), GITAM_EMAIL_ERROR),
  academicYear: z.enum(
    [ACADEMIC_YEAR.FIRST, ACADEMIC_YEAR.SECOND, ACADEMIC_YEAR.THIRD, ACADEMIC_YEAR.FOURTH, ACADEMIC_YEAR.OTHER],
    { message: 'Select your academic year' },
  ),
  branch: z.enum(
    [
      BRANCH.CSE,
      BRANCH.CSE_AIML,
      BRANCH.CSE_DS,
      BRANCH.CSE_CS,
      BRANCH.ECE,
      BRANCH.ECE_VLSI,
      BRANCH.EECE,
      BRANCH.MECHANICAL,
      BRANCH.MECHANICAL_ROBOTICS,
      BRANCH.AEROSPACE,
      BRANCH.CIVIL,
      BRANCH.OTHER,
    ],
    { message: 'Select your branch' },
  ),
});

export const portfolioSchema = z.object({
  portfolio: z.enum(
    [
      PORTFOLIO.MARKETING,
      PORTFOLIO.CONTENT,
      PORTFOLIO.CREATIVE_DESIGN,
      PORTFOLIO.HARDWARE,
      PORTFOLIO.SOFTWARE,
    ],
    { message: 'Select one portfolio to continue' },
  ),
});

export const roleSchema = z.object({
  role: z.enum([ROLE.MEMBER, ROLE.CO_LEAD], { message: 'Select how you want to apply' }),
  existingMember: z.boolean().nullable().optional(),
  existingTeam: z
    .enum([
      EXISTING_TEAM.MARKETING,
      EXISTING_TEAM.CONTENT,
      EXISTING_TEAM.CREATIVE_DESIGN,
      EXISTING_TEAM.HARDWARE,
      EXISTING_TEAM.SOFTWARE,
    ])
    .nullable()
    .optional(),
});

const textAnswer = (label: string, min: number, max: number) =>
  z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length >= min, `${label} requires at least ${min} characters`)
    .refine((v) => v.length <= max, `${label} must be ${max} characters or fewer`);

const optionalTextAnswer = (label: string, max: number) =>
  z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length <= max, `${label} must be ${max} characters or fewer`);

export const questionsSchema = z
  .object({
    role: z.enum([ROLE.MEMBER, ROLE.CO_LEAD]),
    existingMember: z.boolean().nullable().optional(),
    opinion: textAnswer('What do you think about us?', 20, 600),
    learningGoals: textAnswer('Learning goals', 20, 600),
    conflictHandling: optionalTextAnswer('Conflict handling', 600).optional().default(''),
    initiatives: optionalTextAnswer('Initiatives', 600).optional().default(''),
    leadershipExperience: optionalTextAnswer('Leadership experience', 800).optional().default(''),
    taskPrioritization: optionalTextAnswer('Task prioritization', 600).optional().default(''),
    coLeadMotivation: optionalTextAnswer('Co-Lead motivation', 600).optional().default(''),
    teamExperience: optionalTextAnswer('Team experience', 600).optional().default(''),
    commitment: optionalTextAnswer('Commitment', 400).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.role === ROLE.MEMBER) {
      if (!data.opinion || data.opinion.length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['opinion'],
          message: 'What do you think about us? requires at least 20 characters',
        });
      }
      if (!data.learningGoals || data.learningGoals.length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['learningGoals'],
          message: 'Learning goals requires at least 20 characters',
        });
      }
      if (!data.teamExperience || data.teamExperience.length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['teamExperience'],
          message: 'Describe your team experience (at least 20 characters)',
        });
      }
      if (!data.commitment || data.commitment.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['commitment'],
          message: 'Tell us how much time you can commit (at least 10 characters)',
        });
      }
      return;
    }

    // Co-Lead
    if (data.existingMember === true) {
      // Non-member questionnaire not required
      return;
    }

    const coLeadFields: Array<[keyof typeof data, string, number]> = [
      ['opinion', 'What do you think about us?', 20],
      ['learningGoals', 'Learning goals', 20],
      ['conflictHandling', 'Conflict handling', 20],
      ['initiatives', 'Initiatives', 20],
      ['leadershipExperience', 'Leadership experience', 30],
      ['taskPrioritization', 'Task prioritization', 20],
      ['coLeadMotivation', 'Co-Lead motivation', 20],
    ];

    for (const [field, label, min] of coLeadFields) {
      const value = String(data[field] ?? '');
      if (value.length < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${label} requires at least ${min} characters`,
        });
      }
      if (value.length > 800) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${label} must be 800 characters or fewer`,
        });
      }
    }
  });

export const photoSchema = z.object({
  googleDriveUrl: z
    .string()
    .trim()
    .refine((v) => v.length > 0, 'Google Drive photo link is required')
    .refine((v) => {
      try {
        const url = new URL(v);
        return (
          url.protocol === 'https:' &&
          (url.hostname.includes('drive.google.com') ||
            url.hostname.includes('docs.google.com') ||
            url.hostname.includes('drive.usercontent.google.com') ||
            url.hostname.includes('storage.googleapis.com'))
        );
      } catch {
        return false;
      }
    }, 'Enter a valid Google Drive link (https://drive.google.com/...)'),
});

export type PersonalFormValues = z.infer<typeof personalSchema>;
export type PortfolioFormValues = z.infer<typeof portfolioSchema>;
export type RoleFormValues = z.infer<typeof roleSchema>;
export type QuestionsFormValues = z.infer<typeof questionsSchema>;
export type PhotoFormValues = z.infer<typeof photoSchema>;

export type ApplicationDraft = PersonalFormValues &
  PortfolioFormValues &
  RoleFormValues &
  QuestionsFormValues &
  PhotoFormValues;

export const emptyDraft: ApplicationDraft = {
  fullName: '',
  registrationNumber: '',
  phone: '',
  email: '',
  academicYear: '' as ApplicationDraft['academicYear'],
  branch: '' as ApplicationDraft['branch'],
  portfolio: '' as ApplicationDraft['portfolio'],
  role: '' as ApplicationDraft['role'],
  existingMember: null,
  existingTeam: null,
  opinion: '',
  learningGoals: '',
  conflictHandling: '',
  initiatives: '',
  leadershipExperience: '',
  taskPrioritization: '',
  coLeadMotivation: '',
  teamExperience: '',
  commitment: '',
  googleDriveUrl: '',
};
