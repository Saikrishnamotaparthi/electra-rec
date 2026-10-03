# Deployment Guide

Production deployment checklist for the G-ELECTRA Recruitment Platform.

## Pre-Deployment Checklist

- [ ] Firebase project created and registered web app
- [ ] `.env` filled with real Firebase config (never commit)
- [ ] `functions/.env` filled with Gmail credentials (never commit)
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

### Step 6: Deploy Hosting

```bash
npm run build
firebase deploy --only hosting
```

**Expected output:** Hosting URL like `https://g-electra-recruitment.web.app`

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

### Firestore Usage

Monitor in Firebase Console → Firestore → Usage tab.

## Security Notes

- **Never commit** `.env` or `functions/.env` to version control
- **Firestore rules** enforce admin allowlist server-side
- **Cloud Functions** independently validate admin emails
- **Gmail app password** is a secret — rotate if compromised
- **HTTPS-only** — Firebase Hosting provides SSL automatically
- **CORS** — Cloud Functions configured with `cors: true` for the web app

## Post-Launch

1. Monitor `functions:log` for email delivery failures
2. Check Firestore usage quotas
3. Set up budget alerts in Firebase Console (Billing)
4. Document any admin email changes for the team
5. Schedule regular Excel backups of applications
