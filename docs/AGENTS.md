# AGENTS.md

Instructions for AI agents working on this codebase.

## Project Identity

- **Name**: G-ELECTRA Recruitment Platform
- **Purpose**: Recruitment system for G-ELECTRA Smart Systems Club, GITAM Hyderabad
- **Stack**: React 19 + TypeScript + Vite 6 + Tailwind 3.4 + Firebase (Auth/Firestore/Functions)

## Hard Rules

1. **Do not redesign the logo.** Use existing assets in `public/`.
2. **Brand colors are fixed**: charcoal `#233639`, gold `#E9A134`, white `#FFFFFF`.
3. **Fonts are fixed**: Sora (display) + Inter (body), loaded via Google Fonts in `index.html`.
4. **Admin allowlist**: `hello@dotfreelancer.in`, `gelectra@gitam.edu` — enforced in `src/utils/adminAuth.ts`, Firestore rules, AND Cloud Functions. Never scatter these emails.
5. **No mock data in admin pages.** All data comes from Firestore.
6. **Cloud Functions use plain TypeScript + Nodemailer** (not email add-ons or third-party services).
7. **Photo uploads are Google Drive URLs only.** No file upload proxying.
8. **Application ID format**: `GE26-XXXXX` (prefix `APPLICATION_ID_PREFIX = 'GE26'`).
9. **Collection name**: `applications` (hardcoded, not configurable).
10. **Always include `archived == false` in Firestore list queries.**

## Code Conventions

- Path alias: `@/*` → `src/*`
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`
- Vite env vars must be prefixed `VITE_` and accessed via `import.meta.env`
- Custom resolver pattern: `buildResolver(schema)` cast `as never` for RHF compatibility
- Components use named exports
- Lazy-load admin pages and heavy components
- Zod schemas live in `src/schemas/`; server-side mirrors in `functions/src/schema.ts`

## Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript types and enums |
| `src/constants/index.ts` | Club data, labels, DEFAULT_SETTINGS |
| `src/utils/adminAuth.ts` | Admin email allowlist + status metadata |
| `src/schemas/application.ts` | Frontend Zod schemas |
| `src/services/applicationsService.ts` | Firestore CRUD + stats |
| `src/services/emailService.ts` | Callable function wrappers |
| `src/services/excelExport.ts` | xlsx export logic |
| `src/firebase/config.ts` | Conditional Firebase initialization |
| `functions/src/index.ts` | Cloud Functions entry point |
| `firestore.rules` | Security rules |

## Common Tasks

### Add a new form field
1. Add to type in `src/types/index.ts`
2. Add to Zod schema in `src/schemas/application.ts`
3. Add to `emptyDraft` if needed
4. Add to ApplyPage step component
5. Add to Cloud Functions schema (`functions/src/schema.ts`)
6. Add to `applicationsService.ts` mapDoc
7. Add to Excel export column mapping

### Add a new admin page
1. Create `src/pages/admin/AdminXxxPage.tsx`
2. Add lazy route in `src/App.tsx`
3. Add nav link in `AdminLayout.tsx`
4. Use Firestore service, never mock data

### Modify email templates
1. Edit `functions/src/email/templates.ts`
2. Use brand colors (`#233639`, `#E9A134`)
3. Keep responsive HTML (table-based layout)
4. Test with `firebase emulators:start --only functions`

## Build Commands

```bash
npm run build          # tsc -b && vite build
npm run typecheck      # tsc -b --force
npm run lint           # eslint src
npm run dev            # vite dev server
cd functions && npm run build  # compile Cloud Functions
```

## Deployment

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

## Do Not

- Commit `.env` files or real secrets
- Hardcode admin emails outside `src/utils/adminAuth.ts`
- Add mock/sample data to admin pages
- Use non-brand colors in new UI
- Skip the `archived` filter in Firestore queries
- Add file upload endpoints (use Google Drive URLs)
- Use email services other than Nodemailer + Gmail
