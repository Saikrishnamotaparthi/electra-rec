const BRAND = {
  charcoal: '#233639',
  gold: '#E9A134',
  goldLight: '#F5C15C',
  white: '#FFFFFF',
  mist: '#A8BBBE',
  mistDark: '#7A9498',
};

const logoUrl = 'https://raw.githubusercontent.com/g-electra/assets/main/logo.png';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ConfirmationEmailInput {
  fullName: string;
  applicationId: string;
  portfolioLabel: string;
  roleLabel: string;
  email: string;
}

export function renderConfirmationEmail(input: ConfirmationEmailInput): string {
  const name = escapeHtml(input.fullName);
  const appId = escapeHtml(input.applicationId);
  const portfolio = escapeHtml(input.portfolioLabel);
  const role = escapeHtml(input.roleLabel);
  const email = escapeHtml(input.email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>G-ELECTRA Application Received</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F6F7;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#233639;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F6F7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(35,54,57,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.charcoal} 0%,#2F474B 100%);padding:32px 36px;text-align:center;">
              <img src="${logoUrl}" alt="G-ELECTRA" width="120" style="display:block;margin:0 auto 16px;border-radius:8px;" />
              <h1 style="margin:0;font-size:22px;font-weight:700;color:${BRAND.white};letter-spacing:0.04em;">APPLICATION RECEIVED</h1>
              <p style="margin:8px 0 0;font-size:14px;color:${BRAND.gold};font-weight:600;">G-ELECTRA Smart Systems Club · Recruitment 2026</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${BRAND.charcoal};">Hello ${name},</h2>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3A4F53;">
                Thank you for applying to <strong>G-ELECTRA</strong>. Your application has been received and is now queued for review by our recruitment team.
              </p>

              <!-- Application summary card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;border:1px solid #E5EAEC;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:${BRAND.mistDark};font-weight:600;text-transform:uppercase;letter-spacing:0.06em;width:40%;">Application ID</td>
                        <td style="padding:6px 0;font-size:15px;font-weight:700;color:${BRAND.charcoal};">${appId}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:${BRAND.mistDark};font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Portfolio</td>
                        <td style="padding:6px 0;font-size:15px;font-weight:600;color:${BRAND.charcoal};">${portfolio}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:${BRAND.mistDark};font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Role</td>
                        <td style="padding:6px 0;font-size:15px;font-weight:600;color:${BRAND.charcoal};">${role}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:${BRAND.mistDark};font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
                        <td style="padding:6px 0;font-size:15px;color:${BRAND.charcoal};">${email}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3A4F53;">
                Please save your <strong>Application ID</strong> for future reference. You will receive further updates at this email address as the recruitment process progresses.
              </p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
                <tr>
                  <td style="border-radius:8px;background-color:${BRAND.gold};">
                    <a href="https://g-electra.web.app" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${BRAND.charcoal};text-decoration:none;border-radius:8px;">Visit G-ELECTRA</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.charcoal};padding:24px 36px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:${BRAND.mist};">G-ELECTRA Smart Systems Club</p>
              <p style="margin:0;font-size:12px;color:${BRAND.mistDark};">Department of EECE · GITAM University – Hyderabad</p>
              <p style="margin:12px 0 0;font-size:11px;color:${BRAND.mistDark};">This is an automated confirmation email. Please do not reply directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderStatusUpdateEmail(input: {
  fullName: string;
  applicationId: string;
  status: string;
}): string {
  const name = escapeHtml(input.fullName);
  const appId = escapeHtml(input.applicationId);
  const status = escapeHtml(input.status);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>G-ELECTRA Application Update</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F6F7;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#233639;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F6F7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.charcoal} 0%,#2F474B 100%);padding:28px 36px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:${BRAND.white};">APPLICATION UPDATE</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3A4F53;">Hello ${name},</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3A4F53;">
                Your application <strong>${appId}</strong> has been updated to status:
              </p>
              <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:${BRAND.gold};text-transform:uppercase;letter-spacing:0.04em;">${status}</p>
              <p style="margin:0;font-size:14px;color:#3A4F53;">If you have questions, contact the G-ELECTRA recruitment team.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.charcoal};padding:20px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND.mist};">G-ELECTRA Smart Systems Club · GITAM Hyderabad</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
