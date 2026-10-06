"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitApplicationSchema = void 0;
exports.isGoogleDriveUrl = isGoogleDriveUrl;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Shared validation helpers (mirrors the frontend schemas)
// ---------------------------------------------------------------------------
const phoneRegex = /^\d{10}$/;
const registrationRegex = /^\d{10}$/;
const gitamEmailRegex = /^[^\s@]+@(gitam\.edu|student\.gitam\.edu)$/;
const academicYearEnum = zod_1.z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'OTHER']);
const branchEnum = zod_1.z.enum([
    'CSE',
    'CSE_AIML',
    'CSE_DS',
    'CSE_CS',
    'ECE', 'ECE_VLSI', 'EECE', 'MECHANICAL', 'MECHANICAL_ROBOTICS', 'AEROSPACE', 'CIVIL', 'OTHER',
]);
// `WEB_DEVELOPER` is intentionally not accepted for new submissions; it stays a
// valid stored value so historical applications keep rendering in admin views.
const portfolioEnum = zod_1.z.enum([
    'MARKETING', 'CONTENT', 'CREATIVE_DESIGN', 'HARDWARE', 'SOFTWARE',
]);
const roleEnum = zod_1.z.enum(['MEMBER', 'CO_LEAD']);
const existingTeamEnum = zod_1.z.enum([
    'MARKETING', 'CONTENT', 'CREATIVE_DESIGN', 'HARDWARE', 'SOFTWARE',
]);
const personalSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(1, 'This field is required').max(100, 'Name must be 100 characters or fewer'),
    registrationNumber: zod_1.z
        .string()
        .trim()
        .transform((v) => v.toUpperCase().replace(/\s+/g, ''))
        .pipe(zod_1.z
        .string()
        .min(1, 'Registration number is required')
        .regex(registrationRegex, 'Registration number must be exactly 10 digits')),
    phone: zod_1.z
        .string()
        .trim()
        .transform((v) => v.replace(/\s+/g, ''))
        .pipe(zod_1.z
        .string()
        .min(1, 'Contact number is required')
        .regex(phoneRegex, 'Contact number must be exactly 10 digits')),
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .pipe(zod_1.z
        .string()
        .min(1, 'Email is required')
        .regex(gitamEmailRegex, 'Use your official GITAM email (@gitam.edu or @student.gitam.edu)')),
    academicYear: academicYearEnum,
    branch: branchEnum,
});
const applicationSchema = zod_1.z.object({
    portfolio: portfolioEnum,
    role: roleEnum,
    existingMember: zod_1.z.union([zod_1.z.boolean(), zod_1.z.null()]),
    existingTeam: zod_1.z.union([existingTeamEnum, zod_1.z.null()]),
});
const answersSchema = zod_1.z.object({
    opinion: zod_1.z.string().max(2000).optional().default(''),
    learningGoals: zod_1.z.string().max(2000).optional().default(''),
    conflictHandling: zod_1.z.string().max(2000).optional().default(''),
    initiatives: zod_1.z.string().max(2000).optional().default(''),
    leadershipExperience: zod_1.z.string().max(2000).optional().default(''),
    taskPrioritization: zod_1.z.string().max(2000).optional().default(''),
    coLeadMotivation: zod_1.z.string().max(2000).optional().default(''),
    teamExperience: zod_1.z.string().max(2000).optional().default(''),
    commitment: zod_1.z.string().max(2000).optional().default(''),
});
const photoSchema = zod_1.z.object({
    googleDriveUrl: zod_1.z.string().trim().refine((v) => v.length > 0 &&
        /^(https:\/\/(drive\.google\.com|docs\.google\.com|drive\.usercontent\.google\.com)\/)/.test(v), 'Provide a valid Google Drive share link'),
});
exports.submitApplicationSchema = zod_1.z.object({
    personal: personalSchema,
    application: applicationSchema,
    answers: answersSchema,
    photo: photoSchema,
});
function isGoogleDriveUrl(url) {
    return /^(https:\/\/(drive\.google\.com|docs\.google\.com|drive\.usercontent\.google\.com)\/)/.test(url);
}
//# sourceMappingURL=schema.js.map