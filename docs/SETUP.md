# Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Firebase CLI (`npm install -g firebase-tools`)
- A Google account with access to Firebase Console

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it `g-electra-recruitment` (or your preferred name)
3. Disable Google Analytics (optional) → **Create project**

## 2. Register Web App

1. In the project overview, click the **Web** icon (`</>`)
2. Register the app (nickname: `g-electra-web`)
3. **Do not** check "Firebase Hosting" yet (we'll add it later)
4. Click **Register app** → copy the config object
5. You'll need these values for `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=g-electra-recruitment.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=g-electra-recruitment
VITE_FIREBASE_STORAGE_BUCKET=g-electra-recruitment.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## 3. Enable Authentication

1. In Firebase Console → **Build** → **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Google** → set support email → **Save**

## 4. Create Firestore Database

1. **Build** → **Firestore Database** → **Create database**
2. Choose **Start in production mode** (rules will be deployed later)
3. Select a close region (e.g., `asia-south1` for India)

## 5. Configure Environment Variables

Create a `.env` file at the project root (it is gitignored) and paste the Firebase config values from Step 2:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

> The template for **Vercel-side** variables (serverless API routes) is `.env.vercel.example` — those go in the Vercel dashboard, not in `.env`.

## 6. Install Dependencies

```bash
npm install
cd functions
npm install
cd ..
```

## 7. Set Gmail Credentials (for Cloud Functions and Vercel API)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Create an app password (name: `g-electra-functions`)
5. Copy the 16-character password
6. Create `functions/.env` (copy from `functions/.env.example`):

```
GMAIL_USER=your-address@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

7. Set the same values **plus** `FIREBASE_SERVICE_ACCOUNT` (Firebase Console → Project Settings → Service accounts → Generate new private key, pasted as one line) in **Vercel → Project Settings → Environment Variables** so the production API routes can send emails.

## 8. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173` for the landing page and `http://localhost:5173/apply` for the recruitment wizard.

## 9. Deploy

**Production (Vercel):** every push to `main` auto-deploys `https://electra-rec.vercel.app`. Make sure the environment variables from Step 7 are set in the Vercel dashboard.

**Firebase side (rules, indexes, optional functions/hosting):**

```bash
# Deploy everything (Firestore rules, indexes, functions, hosting)
firebase deploy

# Or deploy selectively
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

See [deployment.md](deployment.md) for the full checklist.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Firebase is not configured` | Ensure `.env` exists and contains all `VITE_FIREBASE_*` values; restart dev server |
| Google sign-in blocked | Check authorized domain in Authentication → Settings → Authorized domains |
| Firestore permission denied | Deploy rules: `firebase deploy --only firestore:rules` |
| Functions deploy fails | Check Node version (need 20) and `functions/.env` secrets |
| Composite index missing | Deploy indexes: `firebase deploy --only firestore:indexes` |
