# Deployment Guide

Production deployment checklist for the G-ELECTRA Recruitment Platform.

## Production Deployment — Vercel (Primary)

Production runs at `https://electra-rec.vercel.app`. The SPA plus the serverless API under `api/` (submission, confirmation emails, resend, health) are deployed together.

1. **Import the repo** into Vercel (framework preset: Vite)
2. **Set environment variables** (Project → Settings → Environment Variables), template in `.env.vercel.example`:

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `VITE_FIREBASE_*` | Yes | Firebase web app config (public) |
   | `GMAIL_USER` | Yes | Gmail address used to send emails |
   | `GMAIL_APP_PASSWORD` | Yes | 16-character Gmail App Password |
   | `FIREBASE_SERVICE_ACCOUNT` | Yes | Entire Firebase service-account JSON as **one line** (Firebase Console → Project Settings → Service accounts) |
   | `ADMIN_EMAILS` | No | Comma-separated admin emails allowed to resend emails |

   > Without `FIREBASE_SERVICE_ACCOUNT`, `POST /api/applications` returns **503** and no application/email is created. Check `GET /api/health` to confirm `firebaseAdminConfigured: true`.

3. **Deploy** — every push to `main` triggers a production deployment
4. **Verify** — visit `/`, `/apply`, and `/api/health`; submit one controlled test application and confirm exactly one Firestore document and one confirmation email

## Pre-Deployment Checklist

- [ ] Firebase project created and registered web app
- [ ] `.env` filled with real Firebase config (never commit)
- [ ] `functions/.env` filled with Gmail credentials (never commit)
- [ ] Vercel environment variables set (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_*`)
- [ ] `.firebaserc` updated with your project ID
- [ ] `npm install` completed (root + functions)
- [ ] `cd functions && npm install` completed
- [ ] All TypeScript compiles: `npm run typecheck`
- [ ] Production build succeeds: `npm run build`
- [ ] Functions compile: `cd functions && npm run build`

## Deployment Steps

### Step 1: Update Project ID

Edit `.firebaserc`:

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

**Expected output:** Rules and indexes deployed successfully.

### Step 4: Set Cloud Functions Secrets

```bash
firebase functions:secrets:set GMAIL_USER
firebase functions:secrets:set GMAIL_APP_PASSWORD
```

Enter the values when prompted (from `functions/.env`).

### Step 5: Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

**Expected output:** 4 functions deployed:
- `submitApplication`
- `resendConfirmationEmail`
- `updateApplicationStatus`
- `getRecruitmentStats`

### Step 6: Deploy the Frontend

**Vercel (production):**

```bash
git push origin main   # auto-deploys to https://electra-rec.vercel.app
```

**Firebase Hosting (optional alternative):**

```bash
npm run build
firebase deploy --only hosting
```

**Expected output:** Hosting URL like `https://g-electra-recruitment.web.app` (or the Vercel production URL)

### Step 7: Verify Deployment

1. Visit the hosting URL — landing page loads
2. Navigate to `/apply` — form renders
3. Submit a test application — confirmation email received
4. Sign in at `/admin` with an authorized Google account
5. Dashboard shows the test application
6. Change status — notification email received
7. Export Excel — file downloads correctly

## Selective Deployment

| Command | What it deploys |
|---------|-----------------|
| `firebase deploy` | Everything |
| `firebase deploy --only firestore:rules` | Security rules only |
| `firebase deploy --only firestore:indexes` | Composite indexes only |
| `firebase deploy --only functions` | Cloud Functions only |
| `firebase deploy --only hosting` | Static hosting only |

## Rollback

### Revert Hosting to Previous Release

```bash
firebase hosting:rollback
```

### Redeploy Previous Functions

```bash
firebase functions:delete submitApplication
# Then redeploy with the previous code version
firebase deploy --only functions
```

### Revert Firestore Rules

```bash
git checkout previous-commit -- firestore.rules
firebase deploy --only firestore:rules
```

## Environment Variables

### Frontend (Vite) — `.env`

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics ID (optional) |

### Backend (Cloud Functions) — `functions/.env` / Secrets

| Variable | Description |
|----------|-------------|
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | 16-character Gmail app password |

### Backend (Vercel Serverless API) — Vercel Dashboard

| Variable | Description |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin service-account JSON (one line) |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | 16-character Gmail app password |
| `ADMIN_EMAILS` | Optional allowlist for resend requests |

## Monitoring

### View Function Logs

```bash
firebase functions:log
firebase functions:log --only submitApplication
```

### Check Function Status

```bash
firebase functions:list
```

### Vercel Logs

View real-time function logs in the Vercel dashboard (Project → Observability / Functions) — this is where `/api/applications` errors (e.g. missing `FIREBASE_SERVICE_ACCOUNT`) appear.

### Firestore Usage

Monitor in Firebase Console → Firestore → Usage tab.

## Security Notes

- **Never commit** `.env` or `functions/.env` to version control
- **Vercel env vars** hold the live secrets — restrict dashboard access to coordinators
- **Firestore rules** enforce admin allowlist server-side
- **API routes and Cloud Functions** independently validate payloads and admin emails
- **Gmail app password** is a secret — rotate if compromised
- **HTTPS-only** — Vercel and Firebase Hosting both provide SSL automatically
- **CORS** — Cloud Functions configured with `cors: true` for the web app

## Post-Launch

1. Monitor `functions:log` for email delivery failures
2. Check Firestore usage quotas
3. Set up budget alerts in Firebase Console (Billing)
4. Document any admin email changes for the team
5. Schedule regular Excel backups of applications
