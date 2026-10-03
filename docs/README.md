# G-ELECTRA Recruitment Platform

A production-ready recruitment platform for **G-ELECTRA Smart Systems Club** (GITAM Hyderabad).

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS 3.4 |
| Routing | React Router 7 (lazy-loaded pages) |
| Forms | React Hook Form + Zod |
| Backend | Firebase (Auth, Firestore, Functions) |
| Functions | Cloud Functions (TypeScript + Nodemailer) |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | Framer Motion |
| Excel | xlsx |

## Features

- **Public recruitment wizard** at `/apply` — 6-step form with autosave drafts, portfolio/role selection, conditional Co-Lead flow, Google Drive photo upload
- **Admin dashboard** at `/admin` — Google sign-in with allowlist enforcement, application list with filters/search/pagination, application detail view, analytics charts, Excel export, settings
- **Cloud Functions** — `submitApplication`, `resendConfirmationEmail`, `updateApplicationStatus`, `getRecruitmentStats` (admin-guarded)
- **Email** — branded HTML confirmation and status-update emails via Gmail (Nodemailer)
- **Excel export** — all-applications workbook + per-portfolio sheets
- **Firestore rules** — public create-only, admin read/update via hardcoded allowlist
- **Composite indexes** — pre-configured for common admin queries

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env   # fill in Firebase web app config

# 3. Start dev server
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for full Firebase project setup.

## Project Structure

```
├── public/                 # Static assets (logo, favicon, og-image)
├── src/
│   ├── components/ui/      # Button, FormControls, Cards, Misc
│   ├── components/shared/  # Toast
│   ├── firebase/           # config.ts, functions.ts
│   ├── hooks/              # useDraft
│   ├── pages/              # LandingPage, ApplyPage
│   ├── pages/admin/        # Admin pages (guarded)
│   ├── schemas/            # Zod schemas
│   ├── services/           # applications, email, excel, adminAuth
│   ├── types/              # TypeScript types & enums
│   ├── utils/              # helpers + adminAuth
│   └── constants/          # club data, labels, defaults
├── functions/              # Cloud Functions (TypeScript)
│   └── src/
│       ├── index.ts        # Callable functions
│       ├── schema.ts       # Zod validation (server-side)
│       └── email/templates.ts  # HTML email templates
├── firestore.rules         # Security rules
├── firestore.indexes.json  # Composite indexes
├── firebase.json           # Firebase hosting/functions/firestore config
└── docs/                   # Documentation
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero, why join, process, FAQ) |
| `/apply` | 6-step recruitment wizard |
| `/admin` | Auth guard + admin layout |
| `/admin/dashboard` | Overview stats + charts |
| `/admin/applications` | Filterable application list |
| `/admin/applications/:docId` | Application detail + status control |
| `/admin/analytics` | Deep analytics charts |
| `/admin/exports` | Excel export tools |
| `/admin/settings` | Club settings + admin emails |

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — Firebase project setup and deployment
- [docs/BLUEPRINT.md](docs/BLUEPRINT.md) — Architecture and design decisions
- [docs/AGENTS.md](docs/AGENTS.md) — AI agent instructions
- [docs/user-manual-applicant.md](docs/user-manual-applicant.md) — Applicant guide
- [docs/user-manual-admin.md](docs/user-manual-admin.md) — Admin guide
- [docs/deployment.md](docs/deployment.md) — Production deployment checklist

## Branding

- Primary charcoal: `#233639`
- Accent gold: `#E9A134`
- White: `#FFFFFF`
- Fonts: Sora (display) + Inter (body)

Logo assets are in `public/`. Do not redesign the logo.
