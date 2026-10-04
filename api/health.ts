import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  return res.status(200).json({
    ok: true,
    service: 'g-electra-recruitment-api',
    emailConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    firebaseAdminConfigured: Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ?? process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    ),
  });
}
