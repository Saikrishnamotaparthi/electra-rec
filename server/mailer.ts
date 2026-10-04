import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type ApplicationEmailPayload = {
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
};

let cachedTransporter: Transporter | null = null;

export function getMailer(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
  });

  return cachedTransporter;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildConfirmationHtml(payload: ApplicationEmailPayload): string {
  const name = escapeHtml(payload.fullName);
  const appId = escapeHtml(payload.applicationId);
  const reg = escapeHtml(payload.registrationNumber);
  const email = escapeHtml(payload.email);
  const phone = escapeHtml(payload.phone);
  const year = escapeHtml(payload.academicYear);
  const branch = escapeHtml(payload.branch);
  const portfolio = escapeHtml(payload.portfolio);
  const role = escapeHtml(payload.role);

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#152024;border-radius:16px;border:1px solid rgba(233,161,52,0.25);overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#233639 0%,#1a282c 100%);padding:28px 32px;">
                <p style="margin:0;color:#E9A134;font-size:12px;letter-spacing:0.18em;font-weight:700;">G-ELECTRA SMART SYSTEMS CLUB</p>
                <h1 style="margin:10px 0 0;color:#ffffff;font-size:22px;line-height:1.3;">Application Received</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.6;">
                  Dear <strong style="color:#ffffff;">${name}</strong>,
                </p>
                <p style="margin:14px 0 0;color:#cbd5e1;font-size:14px;line-height:1.65;">
                  Thank you for applying to <strong style="color:#E9A134;">G-ELECTRA Smart Systems Club</strong>.
                  We have received your application and it is now under review.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid rgba(233,161,52,0.2);border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0;color:#94a3b8;font-size:11px;letter-spacing:0.14em;font-weight:700;">APPLICATION ID</p>
                      <p style="margin:6px 0 0;color:#E9A134;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;font-weight:700;letter-spacing:0.06em;">${appId}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;width:42%;">Registration</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${reg}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;">Email</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;">Phone</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;">Academic year</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${year}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;">Branch</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${branch}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;">Portfolio</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${portfolio}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;">Role</td>
                    <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${role}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;">
                <p style="margin:0;color:#cbd5e1;font-size:13px;line-height:1.6;">
                  Please save your application ID for future reference. The recruitment team will
                  contact you at this email if you are shortlisted or need further information.
                </p>
                <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">
                  — Team G-ELECTRA, GITAM Hyderabad
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildConfirmationSubject(applicationId: string): string {
  return `Application received — ${applicationId} | G-ELECTRA Smart Systems Club`;
}

export async function sendConfirmationEmail(payload: ApplicationEmailPayload): Promise<string> {
  const transporter = getMailer();
  const from = process.env.GMAIL_USER ?? 'gelectra@gitam.edu';
  const info = await transporter.sendMail({
    from: `"G-ELECTRA Recruitment" <${from}>`,
    to: payload.email,
    replyTo: from,
    subject: buildConfirmationSubject(payload.applicationId),
    html: buildConfirmationHtml(payload),
    text: [
      'Application received — G-ELECTRA Smart Systems Club',
      '',
      `Dear ${payload.fullName},`,
      '',
      'Thank you for applying to G-ELECTRA Smart Systems Club.',
      `Your application ID is: ${payload.applicationId}`,
      `Registration number: ${payload.registrationNumber}`,
      `Portfolio: ${payload.portfolio}`,
      `Role: ${payload.role}`,
      '',
      'Please save this ID. The recruitment team will contact you if shortlisted.',
      '— Team G-ELECTRA, GITAM Hyderabad',
    ].join('\n'),
  });

  return typeof info?.messageId === 'string' ? info.messageId : '';
}
