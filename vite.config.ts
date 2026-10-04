import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

type JsonBody = Record<string, unknown> | null;

function readJsonBody(req: IncomingMessage): Promise<JsonBody> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw) as JsonBody);
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function getIp(req: IncomingMessage): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0]!.trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

/**
 * Localhost stand-in for Vercel serverless functions so `npm run dev`
 * can send confirmation emails and record emailStatus without deploying.
 */
function localApiPlugin(): Plugin {
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();

  function allowRequest(key: string, limit = 8, windowMs = 60_000): boolean {
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }

  async function loadMailer(server: import('vite').ViteDevServer) {
    return server.ssrLoadModule('/server/mailer.ts') as Promise<{
      sendConfirmationEmail: (payload: {
        applicationId: string;
        fullName: string;
        registrationNumber: string;
        email: string;
        phone: string;
        academicYear: string;
        branch: string;
        portfolio: string;
        role: string;
        existingMember?: boolean | null;
        existingTeam?: string | null;
      }) => Promise<void>;
    }>;
  }

  async function loadAdmin(server: import('vite').ViteDevServer) {
    return server.ssrLoadModule('/server/firebaseAdmin.ts') as Promise<{
      getFirestoreClient: () => {
        collection: (name: string) => {
          add: (data: unknown) => Promise<{
            id: string;
            update: (data: unknown) => Promise<void>;
          }>;
        };
      } | null;
      markEmailResult: (
        docId: string,
        emailStatus: 'sent' | 'failed' | 'pending',
        emailError: string | null,
      ) => Promise<void>;
      verifyAdminIdToken: (idToken: string) => Promise<string>;
    }>;
  }

  return {
    name: 'g-electra-local-api',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        void (async () => {
          const url = (req.url ?? '/').split('?')[0] ?? '/';
          const method = (req.method ?? 'GET').toUpperCase();

          if (url === '/health' || url === '/health/') {
            if (method !== 'GET') {
              sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
              return;
            }
            sendJson(res, 200, {
              ok: true,
              service: 'g-electra-recruitment-api',
              mode: 'local-vite',
              emailConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
              firebaseAdminConfigured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
            });
            return;
          }

          if (method !== 'POST') {
            sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
            return;
          }

          const body = await readJsonBody(req);

          if (url === '/applications' || url === '/applications/') {
            if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
              sendJson(res, 503, {
                ok: false,
                error: 'Gmail is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env',
              });
              return;
            }

            let adminMod: Awaited<ReturnType<typeof loadAdmin>> | null = null;
            let firestore: ReturnType<Awaited<ReturnType<typeof loadAdmin>>['getFirestoreClient']> =
              null;
            try {
              adminMod = await loadAdmin(server);
              firestore = adminMod.getFirestoreClient();
            } catch (err) {
              console.error('[local-api] firebase-admin load failed', err);
            }

            if (!firestore || !adminMod) {
              sendJson(res, 503, {
                ok: false,
                error:
                  'FIREBASE_SERVICE_ACCOUNT is not set in .env — cannot create application server-side. Client fallback will be used.',
              });
              return;
            }

            const personal = (body?.personal ?? {}) as Record<string, string>;
            const application = (body?.application ?? {}) as Record<string, unknown>;
            const answers = (body?.answers ?? {}) as Record<string, unknown>;
            const photo = (body?.photo ?? {}) as Record<string, unknown>;

            if (!personal.fullName || !personal.email || !application.portfolio || !application.role) {
              sendJson(res, 400, { ok: false, error: 'Invalid application payload.' });
              return;
            }

            const { sendConfirmationEmail } = await loadMailer(server);
            const APPLICATION_ID_PREFIX = 'GE26';
            const applicationId = `${APPLICATION_ID_PREFIX}-${Math.floor(Math.random() * 90000) + 10000}`;
            const now = Date.now();
            const fullName = String(personal.fullName).trim();
            const registrationNumber = String(personal.registrationNumber ?? '')
              .toUpperCase()
              .replace(/\s+/g, '');
            const email = String(personal.email).toLowerCase().trim();
            const phone = String(personal.phone ?? '').trim();
            const academicYear = String(personal.academicYear ?? '');
            const branch = String(personal.branch ?? '');
            const portfolio = String(application.portfolio ?? '');
            const role = String(application.role ?? '');
            const existingMember = (application.existingMember ?? null) as boolean | null;
            const existingTeam = (application.existingTeam ?? null) as string | null;
            const googleDriveUrl = String(photo.googleDriveUrl ?? '').trim();

            const doc = {
              applicationId,
              submittedAt: now,
              updatedAt: now,
              status: 'submitted',
              emailStatus: 'pending',
              emailError: null,
              lastEmailAttemptAt: null,
              personal: {
                fullName,
                registrationNumber,
                phone,
                email,
                academicYear,
                branch,
              },
              application: { portfolio, role, existingMember, existingTeam },
              answers,
              photo: { googleDriveUrl },
              metadata: {
                userAgent: String(body?.userAgent ?? ''),
                createdAt: now,
                updatedAt: now,
                statusChangedAt: null,
                statusChangedBy: null,
              },
              archived: false,
            };

            try {
              const ref = await firestore.collection('applications').add(doc);
              let emailStatus: 'sent' | 'failed' = 'sent';
              let emailError: string | null = null;
              try {
                await sendConfirmationEmail({
                  applicationId,
                  fullName,
                  registrationNumber,
                  email,
                  phone,
                  academicYear,
                  branch,
                  portfolio,
                  role,
                  existingMember,
                  existingTeam,
                });
              } catch (err) {
                emailStatus = 'failed';
                emailError = err instanceof Error ? err.message : 'Failed to send confirmation email.';
              }
              await ref.update({
                emailStatus,
                emailError,
                lastEmailAttemptAt: Date.now(),
                updatedAt: Date.now(),
              });
              sendJson(res, 201, {
                ok: true,
                applicationId,
                docId: ref.id,
                emailStatus,
                emailError,
              });
            } catch (err) {
              console.error('[local-api] applications create failed', err);
              sendJson(res, 502, {
                ok: false,
                error: err instanceof Error ? err.message : 'Failed to save application.',
              });
            }
            return;
          }

          if (url === '/send-application-email' || url === '/send-application-email/') {
            const ip = getIp(req);
            if (!allowRequest(`send:${ip}`)) {
              sendJson(res, 429, { ok: false, error: 'Too many requests. Try again shortly.' });
              return;
            }
            const email = String((body?.email as string) ?? '').toLowerCase().trim();
            const applicationId = String((body?.applicationId as string) ?? '');
            const fullName = String((body?.fullName as string) ?? '');
            if (!email || !applicationId || !fullName) {
              sendJson(res, 400, { ok: false, error: 'Invalid email payload.' });
              return;
            }
            try {
              const { sendConfirmationEmail } = await loadMailer(server);
              await sendConfirmationEmail({
                applicationId,
                fullName,
                registrationNumber: String((body?.registrationNumber as string) ?? ''),
                email,
                phone: String((body?.phone as string) ?? ''),
                academicYear: String((body?.academicYear as string) ?? ''),
                branch: String((body?.branch as string) ?? ''),
                portfolio: String((body?.portfolio as string) ?? ''),
                role: String((body?.role as string) ?? ''),
                existingMember: (body?.existingMember as boolean | null | undefined) ?? null,
                existingTeam: (body?.existingTeam as string | null | undefined) ?? null,
              });

              const docId = typeof body?.docId === 'string' ? body.docId : null;
              if (docId) {
                try {
                  await loadAdmin(server).then((admin) => admin.markEmailResult(docId, 'sent', null));
                } catch {
                  // optional
                }
              }
              sendJson(res, 200, { ok: true });
            } catch (err) {
              console.error('[local-api] send-application-email', err);
              const message =
                err instanceof Error ? err.message : 'Failed to send confirmation email.';
              const docId = typeof body?.docId === 'string' ? body.docId : null;
              if (docId) {
                try {
                  await loadAdmin(server).then((admin) =>
                    admin.markEmailResult(docId, 'failed', message),
                  );
                } catch {
                  // optional
                }
              }
              sendJson(res, 502, { ok: false, error: message });
            }
            return;
          }

          if (url === '/resend-application-email' || url === '/resend-application-email/') {
            const authHeader = req.headers.authorization ?? '';
            const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
            if (!idToken) {
              sendJson(res, 401, { ok: false, error: 'Missing admin auth token.' });
              return;
            }
            try {
              const admin = await loadAdmin(server);
              const adminEmail = await admin.verifyAdminIdToken(idToken);
              const { sendConfirmationEmail } = await loadMailer(server);
              await sendConfirmationEmail({
                applicationId: String((body?.applicationId as string) ?? ''),
                fullName: String((body?.fullName as string) ?? ''),
                registrationNumber: String((body?.registrationNumber as string) ?? ''),
                email: String((body?.email as string) ?? '').toLowerCase().trim(),
                phone: String((body?.phone as string) ?? ''),
                academicYear: String((body?.academicYear as string) ?? ''),
                branch: String((body?.branch as string) ?? ''),
                portfolio: String((body?.portfolio as string) ?? ''),
                role: String((body?.role as string) ?? ''),
              });
              const docId = String((body?.docId as string) ?? '');
              if (docId) await admin.markEmailResult(docId, 'sent', null);
              sendJson(res, 200, { ok: true, sentBy: adminEmail });
            } catch (err) {
              console.error('[local-api] resend-application-email', err);
              const message =
                err instanceof Error ? err.message : 'Failed to resend confirmation email.';
              const docId = typeof body?.docId === 'string' ? body.docId : null;
              if (docId) {
                try {
                  const admin = await loadAdmin(server);
                  await admin.markEmailResult(docId, 'failed', message);
                } catch {
                  // optional
                }
              }
              const status = /authorized|not configured|verify/i.test(message) ? 403 : 502;
              sendJson(res, status, { ok: false, error: message });
            }
            return;
          }

          sendJson(res, 404, { ok: false, error: `Unknown API route: ${url}` });
        })().catch((err) => {
          console.error('[local-api] unhandled', err);
          if (!res.headersSent) {
            sendJson(res, 500, { ok: false, error: 'Local API error.' });
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (value && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            charts: ['recharts'],
            motion: ['framer-motion'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
