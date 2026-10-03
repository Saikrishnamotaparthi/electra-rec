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

export type EmailApiResult = {
  ok: boolean;
  error?: string;
};

export type SendConfirmationInput = ApplicationEmailPayload & {
  docId?: string;
};

export type ResendConfirmationInput = SendConfirmationInput & {
  idToken: string;
};

export type CreateApplicationApiInput = {
  personal: {
    fullName: string;
    registrationNumber: string;
    phone: string;
    email: string;
    academicYear: string;
    branch: string;
  };
  application: {
    portfolio: string;
    role: string;
    existingMember?: boolean | null;
    existingTeam?: string | null;
  };
  answers?: Record<string, string | undefined>;
  photo?: { googleDriveUrl?: string };
  userAgent?: string;
};

export type CreateApplicationApiResult = {
  ok: boolean;
  applicationId?: string;
  docId?: string;
  emailStatus?: 'sent' | 'failed';
  emailError?: string | null;
  error?: string;
};

async function postJson<T>(path: string, body: unknown, idToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') ?? '';
  const text = await res.text();
  let data: unknown = null;
  if (contentType.includes('application/json') || text.trim().startsWith('{')) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  const isJsonResult =
    data !== null &&
    typeof data === 'object' &&
    'ok' in data &&
    typeof (data as { ok: unknown }).ok === 'boolean';

  if (!res.ok || !isJsonResult) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : contentType.includes('text/html') || !contentType.includes('application/json')
          ? `API not available at ${path} (got ${res.status} ${contentType || 'no content-type'}). Local dev uses the Vite /api middleware — restart npm run dev after pulling these changes.`
          : `API returned ${res.status}`;
    return { ok: false, error: message } as T;
  }

  return data as T;
}

export async function createApplicationViaApi(
  input: CreateApplicationApiInput,
): Promise<CreateApplicationApiResult> {
  try {
    return await postJson<CreateApplicationApiResult>('/api/applications', input);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Could not reach recruitment API: ${err.message}`
          : 'Could not reach recruitment API.',
    };
  }
}

export async function sendApplicationConfirmation(
  input: SendConfirmationInput,
): Promise<EmailApiResult> {
  try {
    return await postJson<EmailApiResult>('/api/send-application-email', input);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Could not reach email API: ${err.message}`
          : 'Could not reach email API.',
    };
  }
}

export async function resendApplicationConfirmation(
  input: ResendConfirmationInput,
): Promise<EmailApiResult> {
  try {
    return await postJson<EmailApiResult>('/api/resend-application-email', input, input.idToken);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Could not reach email API: ${err.message}`
          : 'Could not reach email API.',
    };
  }
}
