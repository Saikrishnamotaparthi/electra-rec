# G-ELECTRA — Recruitment Platform

> A production-ready recruitment system for **G-ELECTRA Smart Systems Club**, GITAM Hyderabad.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Overview

G-ELECTRA Recruitment Platform is a full-stack web application that lets students apply to join the club's technical and creative teams, while giving club coordinators a secure admin portal to review, filter, export, and manage every application.

**Live routes**

| Route | Audience | Description |
|-------|----------|-------------|
| `/` | Public | Club landing page — hero, why join, recruitment process, FAQ |
| `/apply` | Public | 6-step recruitment wizard with autosave drafts |
| `/admin` | Authorized admins | Google sign-in guard → dashboard, applications, analytics, exports, settings |

---

## Features

### Applicants
- **6-step application wizard** — Personal → Portfolio → Role → Questions → Photo → Review
- **Autosave drafts** — progress saved locally; leave and resume anytime
- **Smart conditional questions** — different question sets for Member vs Co-Lead, existing vs new applicants
- **Portfolio selection** — Marketing, Content, Creative Design, Hardware, Software (Web Developer intake is closed; historical Web Developer records stay visible to admins)
- **Strict input validation** — registration and phone numbers must be exactly 10 digits; email must be a GITAM address (`@gitam.edu` / `@student.gitam.edu`)
- **Google Drive photo upload** — share link only (no file storage)
- **Email receipt** — branded confirmation email sent on successful submission, with a WhatsApp group CTA
- **Application ID** — unique `GE26-XXXXX` reference on every submission

### Admins
- **Secure Google sign-in** — allowlist-enforced (`hello@dotfreelancer.in`, `gelectra@gitam.edu`)
- **Live dashboard** — total applications, role split, status breakdown, portfolio distribution, submission trends
- **Application manager** — filter by portfolio, role, status, year, branch, date range; client-side search
- **Application detail** — full answers, photo link, metadata, status control, email resend
- **Analytics** — deep-dive charts across portfolios, branches, years, and statuses
- **Excel export** — full workbook (summary + all applications + 6 team sheets) or single-team export
- **Settings** — club info, recruitment year, admin email list

### Platform
- **Vercel serverless API** — `POST /api/applications` validates, writes to Firestore, and emails the receipt server-side (Cloud Functions kept as fallback)
- **Firebase Auth** — Google sign-in with server-side allowlist
- **Firestore** — secure document database with composite indexes
- **Security rules** — public create-only for applicants; admin-only read/update
- **Confirmation emails** — branded HTML emails (charcoal `#233639` / gold `#E9A134`)
- **Status notifications** — applicants emailed when status changes
- **Lazy-loaded pages** — admin routes split into separate bundles
- **Responsive design** — works on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS 3.4, custom brand palette |
| Forms | React Hook Form + Zod validation |
| Routing | React Router 7 (lazy-loaded) |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Firebase (Auth, Firestore) + Vercel serverless API (submission + email) |
| Email | Branded HTML confirmation emails |
| Excel | xlsx |

---

## Branding

| Token | Value |
|-------|-------|
| Charcoal | `#233639` |
| Gold | `#E9A134` |
| White | `#FFFFFF` |
| Display font | Sora |
| Body font | Inter |

Logo assets are in `public/`. The official logo must not be redesigned.

---

## Quick Start

### Prerequisites
- **Node.js 20+**
- **npm 10+**
- A Google account (for Firebase + Google sign-in)

### 1. Clone and install

```bash
git clone https://github.com/Saikrishnamotaparthi/electra-rec.git
cd electra-rec
npm install
```

### 2. Configure environment

Create a `.env` file at the project root (it is gitignored) and fill in your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

> Get these values from **Firebase Console → Project Settings → General → Your apps → SDK setup**.

### 3. Set up Firebase (one-time)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. **Register a Web app** and copy the config into `.env`
3. **Enable Authentication → Google** sign-in
4. **Create a Firestore database** (production mode)
5. Deploy security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

| URL | Page |
|-----|------|
| `http://localhost:5173/` | Landing page |
| `http://localhost:5173/apply` | Recruitment wizard |
| `http://localhost:5173/admin` | Admin portal |

### 5. Build for production

```bash
npm run build
```

Output goes to `dist/`. Production deploys automatically via **Vercel** on every push to `main`; use `firebase deploy --only hosting` only for Firebase Hosting setups.

---

## Environment Variables

All required frontend variables live in `.env` at the project root (gitignored — never commit it).

### Firebase Web App Config

Frontend vars must be prefixed with `VITE_`.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Auth domain (e.g. `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Storage bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Google Analytics measurement ID |

### Gmail — Email Receipts

Used to send confirmation emails to applicants. Set them **twice**: in `functions/.env` (Cloud Functions) and in Vercel → Project Settings → Environment Variables (serverless API routes).

| Variable | Required | Description |
|----------|----------|-------------|
| `GMAIL_USER` | Yes | Gmail address used to send emails |
| `GMAIL_APP_PASSWORD` | Yes | 16-character Gmail App Password |

**How to get a Gmail App Password:**
1. Enable **2-Step Verification** on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an app password (name: `g-electra`)
4. Copy the 16-character password into `GMAIL_APP_PASSWORD`

### Vercel — Serverless API

Production runs on Vercel (`https://electra-rec.vercel.app`). The API routes under `api/` validate the payload, create the Firestore document, and send the confirmation email. Set these in Vercel → Project Settings → Environment Variables (template: `.env.vercel.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Yes | Gmail credentials for confirmation emails |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Entire Firebase service-account JSON pasted as one line (Firebase Console → Project Settings → Service accounts) |
| `ADMIN_EMAILS` | No | Comma-separated admin emails allowed to resend emails |

> **Never commit `.env`** — it is gitignored. Share `.env.vercel.example` only.

---

## Project Structure

```
g-electra-recruitment/
├── public/                      # Static assets (logo, favicon, OG image)
├── src/
│   ├── components/
│   │   ├── ui/                  # Button, FormControls, Cards, Misc
│   │   └── shared/              # Toast notifications
│   ├── firebase/                # Firebase config + functions client
│   ├── hooks/                   # useDraft (autosave)
│   ├── pages/
│   │   ├── LandingPage.tsx      # Public landing
│   │   ├── ApplyPage.tsx        # 6-step application wizard
│   │   └── admin/               # Admin dashboard, applications, analytics, exports, settings
│   ├── schemas/                 # Zod validation schemas
│   ├── services/                # Firestore, email, Excel, auth services
│   ├── types/                   # TypeScript types & enums
│   ├── utils/                   # Helpers + admin allowlist
│   └── constants/               # Club data, labels, defaults
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Composite indexes
├── firebase.json                # Firebase Hosting + Firestore config
├── api/                        # Vercel serverless routes (submission, email, health)
├── server/                     # Shared server helpers (Firebase Admin, Gmail mailer)
├── .env.vercel.example         # Vercel environment variable template
└── docs/                        # Setup, blueprint, user manuals, deployment guide
```

---

## Admin Access

Only authorized Google accounts can sign in to `/admin`:

- `hello@dotfreelancer.in`
- `gelectra@gitam.edu`

To add an admin, update the allowlist in `src/constants/index.ts` (and `firestore.rules`) and redeploy.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/SETUP.md](docs/SETUP.md) | Full Firebase project setup walkthrough |
| [docs/BLUEPRINT.md](docs/BLUEPRINT.md) | Architecture & design decisions |
| [docs/deployment.md](docs/deployment.md) | Production deployment checklist |
| [docs/user-manual-applicant.md](docs/user-manual-applicant.md) | How students apply |
| [docs/user-manual-admin.md](docs/user-manual-admin.md) | Admin portal guide |
| [docs/AGENTS.md](docs/AGENTS.md) | AI agent / contributor instructions |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint on `src/` |

---

## Deployment

Production is deployed on **Vercel**; every push to `main` triggers a new production deploy.

```bash
# Ship a change to production
git add <files> && git commit -m "<type>(<scope>): <subject>" && git push origin main
```

Firebase CLI is still used for the database side:

```bash
# Deploy security rules + indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Cloud Functions (optional fallback submission path)
firebase deploy --only functions
```

Set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `FIREBASE_SERVICE_ACCOUNT` in the Vercel dashboard before the first production submission. See [docs/deployment.md](docs/deployment.md) for the full checklist (auth setup, admin allowlist, monitoring).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m "Add amazing feature"`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please read [docs/AGENTS.md](docs/AGENTS.md) for code conventions before contributing.

---

## License

This project is proprietary to **G-ELECTRA Smart Systems Club**, GITAM University – Hyderabad. All rights reserved.

---

## Support

For questions or issues, contact the G-ELECTRA recruitment team or open a GitHub issue.
