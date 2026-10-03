"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitApplicationSchema = void 0;
exports.isGoogleDriveUrl = isGoogleDriveUrl;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Shared validation helpers (mirrors the frontend schemas)
// ---------------------------------------------------------------------------
const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const academicYearEnum = zod_1.z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'OTHER']);
const branchEnum = zod_1.z.enum([
    'CSE', 'ECE', 'ECE_VLSI', 'EECE', 'MECHANICAL', 'MECHANICAL_ROBOTICS', 'AEROSPACE', 'CIVIL', 'OTHER',
]);
const portfolioEnum = zod_1.z.enum([
    'MARKETING', 'CONTENT', 'CREATIVE_DESIGN', 'WEB_DEVELOPER', 'HARDWARE', 'SOFTWARE',
]);
const roleEnum = zod_1.z.enum(['MEMBER', 'CO_LEAD']);
const existingTeamEnum = zod_1.z.enum(['MARKETING', 'CONTENT', 'CREATIVE_DESIGN']);
const personalSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(1, 'This field is required').max(100, 'Name must be 100 characters or fewer'),
    registrationNumber: zod_1.z.string().trim().transform((v) => v.toUpperCase().replace(/\s+/g, '')).pipe(zod_1.z.string().min(3, 'Enter a valid registration number')),
    phone: zod_1.z.string().trim().pipe(zod_1.z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number')),
    email: zod_1.z.string().trim().toLowerCase().pipe(zod_1.z.string().regex(emailRegex, 'Enter a valid email address')),
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