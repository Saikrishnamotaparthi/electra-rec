import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, type FieldErrors } from 'react-hook-form';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CloudOff,
  FileCheck2,
  Info,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import {
  ACADEMIC_YEAR_LABELS,
  BRANCH_LABELS,
  CLUB_NAME,
  CLUB_TAGLINE,
  EXISTING_TEAM_LABELS,
  LOGO_ALT,
  LOGO_PATH,
  PORTFOLIO_LABELS,
  ROLE_LABELS,
} from '@/constants';
import {
  ROLE,
  type AcademicYear,
  type Branch,
  type ExistingTeam,
  type Portfolio,
  type Role,
} from '@/types';
import {
  emptyDraft,
  personalSchema,
  photoSchema,
  portfolioSchema,
  questionsSchema,
  roleSchema,
  type ApplicationDraft,
} from '@/schemas/application';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/FormControls';
import { ProgressBar, SectionCard } from '@/components/ui/Misc';
import { PortfolioList, RadioCard } from '@/components/ui/Cards';
import { useDraft, clearDraft } from '@/hooks/useDraft';
import { useToast } from '@/components/shared/Toast';
import { submitApplicationDirect } from '@/services/applicationsService';
import { cn, sanitizeText } from '@/utils';

type StepId = 'personal' | 'portfolio' | 'role' | 'questions' | 'photo' | 'review' | 'success';

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'personal', label: 'Personal Details' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'role', label: 'Applying Role' },
  { id: 'questions', label: 'Questions' },
  { id: 'photo', label: 'Photo' },
  { id: 'review', label: 'Review' },
];

const TEXT_COUNTERS: Array<[keyof ApplicationDraft, number]> = [
  ['opinion', 600],
  ['learningGoals', 600],
  ['conflictHandling', 600],
  ['initiatives', 600],
  ['leadershipExperience', 800],
  ['taskPrioritization', 600],
  ['coLeadMotivation', 600],
  ['teamExperience', 600],
  ['commitment', 400],
];

function buildResolver() {
  // Schema built dynamically to match the current role branch
  return async (values: unknown, context: unknown, options: { abortEarly: boolean }) => {
    const draft = values as ApplicationDraft;
    const errors: FieldErrors<ApplicationDraft> = {};

    const personalResult = personalSchema.safeParse(draft);
    if (!personalResult.success) {
      for (const issue of personalResult.error.issues) {
        const key = issue.path.join('.') as keyof ApplicationDraft;
        if (!errors[key]) errors[key] = { message: issue.message } as never;
      }
    }

    const portfolioResult = portfolioSchema.safeParse(draft);
    if (!portfolioResult.success) {
      for (const issue of portfolioResult.error.issues) {
        const key = issue.path.join('.') as keyof ApplicationDraft;
        if (!errors[key]) errors[key] = { message: issue.message } as never;
      }
    }

    const roleResult = roleSchema.safeParse(draft);
    if (!roleResult.success) {
      for (const issue of roleResult.error.issues) {
        const key = issue.path.join('.') as keyof ApplicationDraft;
        if (!errors[key]) errors[key] = { message: issue.message } as never;
      }
    }

    // Only validate questions that apply to the selected flow
    if (draft.role === ROLE.MEMBER || draft.role === ROLE.CO_LEAD) {
      const qResult = questionsSchema.safeParse(draft);
      if (!qResult.success) {
        for (const issue of qResult.error.issues) {
          const key = issue.path.join('.') as keyof ApplicationDraft;
          if (!errors[key]) errors[key] = { message: issue.message } as never;
        }
      }
    }

    const photoResult = photoSchema.safeParse(draft);
    if (!photoResult.success) {
      for (const issue of photoResult.error.issues) {
        const key = issue.path.join('.') as keyof ApplicationDraft;
        if (!errors[key]) errors[key] = { message: issue.message } as never;
      }
    }

    void context;
    if (Object.keys(errors).length > 0) {
      return { values: {} as ApplicationDraft, errors };
    }
    void options;
    return { values: draft, errors: {} };
  };
}

function stepErrors(
  step: StepId,
  draft: ApplicationDraft,
): Record<string, string> {
  const out: Record<string, string> = {};

  const setErrorIfMissing = (key: keyof ApplicationDraft, value: string | null | undefined, msg: string) => {
    const target = (value ?? '').trim();
    if (!target) out[key] = msg;
  };

  if (step === 'personal') {
    setErrorIfMissing('fullName', draft.fullName, 'Full name is required');
    setErrorIfMissing('registrationNumber', draft.registrationNumber, 'Registration number is required');
    setErrorIfMissing('phone', draft.phone, 'Contact number is required');
    setErrorIfMissing('email', draft.email, 'Email is required');
    if (!draft.academicYear) out.academicYear = 'Select your academic year';
    if (!draft.branch) out.branch = 'Select your branch';
  }

  if (step === 'portfolio') {
    if (!draft.portfolio) out.portfolio = 'Select one portfolio to continue';
  }

  if (step === 'role') {
    if (!draft.role) out.role = 'Select how you want to apply';
    if (draft.role === ROLE.CO_LEAD && draft.existingMember === null) {
      out.existingMember = 'Select whether you are an existing G-ELECTRA member';
    }
    if (
      draft.role === ROLE.CO_LEAD &&
      draft.existingMember === true &&
      !draft.existingTeam
    ) {
      out.existingTeam = 'Select your current team';
    }
  }

  if (step === 'questions') {
    if (!draft.role) {
      out.role = 'Select how you want to apply';
    } else if (draft.role === ROLE.MEMBER) {
      if ((draft.opinion ?? '').trim().length < 20) {
        out.opinion = 'What do you think about us? requires at least 20 characters';
      }
      if ((draft.learningGoals ?? '').trim().length < 20) {
        out.learningGoals = 'Learning goals requires at least 20 characters';
      }
      if ((draft.teamExperience ?? '').trim().length < 20) {
        out.teamExperience = 'Describe your team experience (at least 20 characters)';
      }
      if ((draft.commitment ?? '').trim().length < 10) {
        out.commitment = 'Tell us how much time you can commit (at least 10 characters)';
      }
    } else if (draft.role === ROLE.CO_LEAD) {
      if (draft.existingMember === true) {
        if ((draft.opinion ?? '').trim().length < 20) {
          out.opinion = 'What do you think about us? requires at least 20 characters';
        }
        if ((draft.learningGoals ?? '').trim().length < 20) {
          out.learningGoals = 'Learning goals requires at least 20 characters';
        }
        if ((draft.coLeadMotivation ?? '').trim().length < 20) {
          out.coLeadMotivation = 'Co-Lead motivation requires at least 20 characters';
        }
      } else if (draft.existingMember === false) {
        const coLeadFields: Array<[keyof ApplicationDraft, string, number]> = [
          ['opinion', 'What do you think about us?', 20],
          ['learningGoals', 'Learning goals', 20],
          ['conflictHandling', 'Conflict handling', 20],
          ['initiatives', 'Initiatives', 20],
          ['leadershipExperience', 'Leadership experience', 30],
          ['taskPrioritization', 'Task prioritization', 20],
          ['coLeadMotivation', 'Co-Lead motivation', 20],
        ];
        for (const [field, label, min] of coLeadFields) {
          const value = (draft[field] ?? '').toString().trim();
          if (value.length < min) {
            out[field] = `${label} requires at least ${min} characters`;
          }
        }
      } else {
        out.existingMember = 'Select whether you are an existing G-ELECTRA member';
      }
    }
  }

  if (step === 'photo') {
    const url = (draft.googleDriveUrl ?? '').trim();
    if (!url) {
      out.googleDriveUrl = 'Google Drive photo link is required';
    } else {
      try {
        const parsed = new URL(url);
        const validHost =
          parsed.protocol === 'https:' &&
          (parsed.hostname.includes('drive.google.com') ||
            parsed.hostname.includes('docs.google.com') ||
            parsed.hostname.includes('drive.usercontent.google.com') ||
            parsed.hostname.includes('storage.googleapis.com'));
        if (!validHost) {
          out.googleDriveUrl = 'Enter a valid Google Drive link (https://drive.google.com/...)';
        }
      } catch {
        out.googleDriveUrl = 'Enter a valid Google Drive link (https://drive.google.com/...)';
      }
    }
  }

  return out;
}

function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      {message}
    </p>
  );
}

const SUBMITTED_KEY = 'gelectra-last-submitted';

function readSubmittedReg(): string | null {
  try {
    return window.sessionStorage.getItem(SUBMITTED_KEY);
  } catch {
    return null;
  }
}

function rememberSubmittedReg(reg: string): void {
  try {
    window.sessionStorage.setItem(SUBMITTED_KEY, reg);
  } catch {
    // ignore
  }
}

export default function ApplyPage() {
  const { push } = useToast();
  const draftHook = useDraft<ApplicationDraft>(emptyDraft);
  const { data: draft, setData, step, setStep, lastSaved } = draftHook;
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const form = useForm<ApplicationDraft>({
    resolver: buildResolver() as never,
    defaultValues: draft,
    mode: 'onTouched',
  });

  const stepIndex = Math.min(step, STEPS.length - 1);
  const currentStep = STEPS[stepIndex]?.id ?? 'personal';
  const isCoLead = draft.role === ROLE.CO_LEAD;
  const isExistingMemberCoLead = isCoLead && draft.existingMember === true;
  const isNonMemberCoLead = isCoLead && draft.existingMember === false;
  const isSubmitted = Boolean(submittedId);

  const updateDraft = useCallback(
    (patch: Partial<ApplicationDraft>) => {
      setData((prev) => ({ ...prev, ...patch }));
      // keep react-hook-form in sync
      form.reset({ ...form.getValues(), ...patch }, { keepDirty: true, keepValues: true });
    },
    [form, setData],
  );

  const goToStep = useCallback(
    (next: number) => {
      if (isSubmitted) return;
      const clamped = Math.max(0, Math.min(next, STEPS.length - 1));
      setStep(clamped);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [isSubmitted, setStep],
  );

  const validateStep = useCallback(
    (stepId: StepId): boolean => {
      const values = form.getValues();
      const merged = { ...values, ...draft } as ApplicationDraft;
      const errors = stepErrors(stepId, merged);
      setLocalErrors(errors);
      if (Object.keys(errors).length > 0) {
        push('error', 'Please complete the required fields', 'Some information is missing on this step.');
        const firstKey = Object.keys(errors)[0];
        const el = document.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
        return false;
      }
      return true;
    },
    [draft, form, push],
  );

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    // advance to next meaningful step
    let next = stepIndex + 1;
    if (currentStep === 'role') {
      // skip nothing — questions step adapts content
    }
    goToStep(next);
  }, [currentStep, goToStep, stepIndex, validateStep]);

  const handleBack = useCallback(() => {
    setLocalErrors({});
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const onSelectPortfolio = useCallback(
    (p: Portfolio) => {
      updateDraft({ portfolio: p });
      setLocalErrors((e) => ({ ...e, portfolio: '' }));
    },
    [updateDraft],
  );

  const onSelectRole = useCallback(
    (r: Role) => {
      const patch: Partial<ApplicationDraft> = { role: r };
      if (r === ROLE.MEMBER) {
        patch.existingMember = null;
        patch.existingTeam = null;
        patch.leadershipExperience = '';
        patch.taskPrioritization = '';
        patch.coLeadMotivation = '';
        patch.conflictHandling = '';
        patch.initiatives = '';
      } else {
        patch.teamExperience = '';
        patch.commitment = '';
      }
      updateDraft(patch);
      setLocalErrors((e) => ({ ...e, role: '', existingMember: '', existingTeam: '' }));
    },
    [updateDraft],
  );

  const onSubmitReview = useCallback(async () => {
    if (submitting || isSubmitted) return;
    setNetworkError(null);

    // Final full validation
    const results = [
      personalSchema.safeParse(draft),
      portfolioSchema.safeParse(draft),
      roleSchema.safeParse(draft),
      questionsSchema.safeParse(draft),
      photoSchema.safeParse(draft),
    ];
    const failed = results.find((r) => !r.success);
    if (failed && !failed.success) {
      for (const issue of failed.error.issues) {
        const key = String(issue.path[0] ?? '');
        setLocalErrors((e) => ({ ...e, [key]: issue.message }));
      }
      push('error', 'Validation failed', 'Please review the highlighted fields.');
      return;
    }

    if (!confirmChecked) {
      push('error', 'Confirmation required', 'Please confirm that your information is accurate.');
      return;
    }

    const reg = draft.registrationNumber.toUpperCase().replace(/\s+/g, '');
    const alreadySubmitted = readSubmittedReg();
    if (alreadySubmitted && alreadySubmitted === reg) {
      push(
        'error',
        'Already submitted',
        'An application was already submitted from this browser for this registration number.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        personal: {
          fullName: sanitizeText(draft.fullName),
          registrationNumber: draft.registrationNumber.toUpperCase(),
          phone: draft.phone,
          email: draft.email.toLowerCase(),
          academicYear: draft.academicYear as AcademicYear,
          branch: draft.branch as Branch,
        },
        application: {
          portfolio: draft.portfolio as Portfolio,
          role: draft.role as Role,
          existingMember: draft.existingMember ?? null,
          existingTeam: draft.existingTeam ?? null,
        },
        answers: {
          opinion: sanitizeText(draft.opinion ?? ''),
          learningGoals: sanitizeText(draft.learningGoals ?? ''),
          conflictHandling: sanitizeText(draft.conflictHandling ?? ''),
          initiatives: sanitizeText(draft.initiatives ?? ''),
          leadershipExperience: sanitizeText(draft.leadershipExperience ?? ''),
          taskPrioritization: sanitizeText(draft.taskPrioritization ?? ''),
          coLeadMotivation: sanitizeText(draft.coLeadMotivation ?? ''),
          teamExperience: sanitizeText(draft.teamExperience ?? ''),
          commitment: sanitizeText(draft.commitment ?? ''),
        },
        photo: {
          googleDriveUrl: draft.googleDriveUrl.trim(),
        },
      };

      const result = await submitApplicationDirect(payload);

      if (!result.ok) {
        setNetworkError(
          result.error ?? 'Something went wrong while submitting your application.',
        );
        push('error', 'Submission failed', result.error ?? 'Please try again.');
        setSubmitting(false);
        return;
      }

      const applicationId = result.applicationId ?? 'GE26';
      const emailOk = result.emailStatus === 'sent';

      setEmailSent(emailOk);
      rememberSubmittedReg(reg);
      // Reset React draft state BEFORE clearing storage so goToStep/persist
      // cannot re-save the old application over the cleared draft.
      setData(emptyDraft);
      setStep(0);
      clearDraft();
      form.reset(emptyDraft);
      setSubmittedId(applicationId);
      push(
        'success',
        'Application submitted',
        emailOk
          ? 'Save your application ID. A confirmation email has been sent.'
          : 'Save your application ID. Email delivery may be pending — the team will still receive your form.',
      );
    } catch (err) {
      console.error('submit error', err);
      setNetworkError(
        'Unable to reach the recruitment service. Please check your connection and try again.',
      );
      push(
        'error',
        'Unable to submit',
        'Please check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [confirmChecked, draft, form, isSubmitted, push, setData, setStep, submitting]);

  const renderPersonal = () => (
    <SectionCard
      title="Personal Details"
      subtitle="Tell us about yourself. Use your official details where possible."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full Name"
          name="fullName"
          required
          autoComplete="name"
          placeholder="e.g. Ayesha Khan"
          value={draft.fullName}
          onChange={(e) => updateDraft({ fullName: e.target.value })}
          error={localErrors.fullName}
        />
        <Input
          label="Registration Number"
          name="registrationNumber"
          required
          placeholder="e.g. 21BAI1234"
          value={draft.registrationNumber}
          onChange={(e) =>
            updateDraft({ registrationNumber: e.target.value.toUpperCase().replace(/\s+/g, '') })
          }
          error={localErrors.registrationNumber}
        />
        <Input
          label="Contact Number"
          name="phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit mobile number"
          value={draft.phone}
          onChange={(e) => updateDraft({ phone: e.target.value })}
          error={localErrors.phone}
        />
        <Input
          label="GITAM Email ID"
          name="email"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="your.name@gitam.edu"
          value={draft.email}
          onChange={(e) => updateDraft({ email: e.target.value })}
          error={localErrors.email}
          hint="Preferably your official GITAM email."
        />
        <Select
          label="Current Academic Year"
          name="academicYear"
          required
          placeholder="Select academic year"
          value={draft.academicYear || ''}
          onChange={(e) => updateDraft({ academicYear: e.target.value as AcademicYear })}
          error={localErrors.academicYear}
          options={Object.entries(ACADEMIC_YEAR_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select
          label="Branch"
          name="branch"
          required
          placeholder="Select branch"
          value={draft.branch || ''}
          onChange={(e) => updateDraft({ branch: e.target.value as Branch })}
          error={localErrors.branch}
          options={Object.entries(BRANCH_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-mist-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden="true" />
        Your form progress is saved on this device automatically. You can safely refresh and
        return.
      </p>
    </SectionCard>
  );

  const renderPortfolio = () => (
    <SectionCard
      title="Portfolio Selection"
      subtitle="Choose the ONE team you want to join. You can only select a single portfolio."
    >
      {localErrors.portfolio ? <FormFieldError message={localErrors.portfolio} /> : null}
      <div className="mt-4">
        <PortfolioList selected={draft.portfolio as Portfolio | null} onSelect={onSelectPortfolio} />
      </div>
      {draft.portfolio ? (
        <p className="mt-4 rounded-xl border border-gold-500/20 bg-gold-500/10 px-4 py-3 text-sm text-gold-100">
          Selected: <strong>{PORTFOLIO_LABELS[draft.portfolio]}</strong>
        </p>
      ) : null}
    </SectionCard>
  );

  const renderRole = () => (
    <SectionCard
      title="Applying Role"
      subtitle="Tell us how you want to contribute to G-ELECTRA."
    >
      <div role="radiogroup" aria-label="Apply as" className="grid gap-3 sm:grid-cols-2">
        <RadioCard
          label="Member"
          description="Join as a team member and grow with the club."
          selected={draft.role === ROLE.MEMBER}
          onSelect={() => onSelectRole(ROLE.MEMBER)}
        />
        <RadioCard
          label="Co-Lead"
          description="Apply for a leadership role in a portfolio."
          selected={draft.role === ROLE.CO_LEAD}
          onSelect={() => onSelectRole(ROLE.CO_LEAD)}
        />
      </div>
      {localErrors.role ? <FormFieldError message={localErrors.role} /> : null}

      {isCoLead ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-medium text-mist-100">
            Are you a <span className="text-gold-300">G-ELECTRA Member</span>?
          </p>
          <div role="radiogroup" aria-label="Existing G-ELECTRA member" className="grid gap-3 sm:grid-cols-2">
            <RadioCard
              label="G-ELECTRA Member"
              description="I am already part of a G-ELECTRA team."
              selected={draft.existingMember === true}
              onSelect={() =>
                updateDraft({
                  existingMember: true,
                  existingTeam: draft.existingTeam ?? null,
                  // non-member questionnaire not required
                  opinion: draft.opinion,
                  learningGoals: draft.learningGoals,
                  conflictHandling: '',
                  initiatives: '',
                  leadershipExperience: '',
                  taskPrioritization: '',
                  coLeadMotivation: '',
                })
              }
            />
            <RadioCard
              label="Not a G-ELECTRA Member"
              description="I am applying from outside the current team."
              selected={draft.existingMember === false}
              onSelect={() =>
                updateDraft({
                  existingMember: false,
                  existingTeam: null,
                })
              }
            />
          </div>
          {localErrors.existingMember ? <FormFieldError message={localErrors.existingMember} /> : null}

          {isExistingMemberCoLead ? (
            <div>
              <Select
                label="You are from which team?"
                name="existingTeam"
                required
                placeholder="Select your current team"
                value={draft.existingTeam || ''}
                onChange={(e) => updateDraft({ existingTeam: e.target.value as ExistingTeam })}
                error={localErrors.existingTeam}
                options={Object.entries(EXISTING_TEAM_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );

  const counterFor = (key: keyof ApplicationDraft) => {
    const max = TEXT_COUNTERS.find(([k]) => k === key)?.[1] ?? 600;
    const value = String(draft[key] ?? '');
    return { current: value.length, max };
  };

  const renderQuestions = () => {
    if (!draft.role) {
      return (
        <SectionCard title="Questions">
          <p className="text-sm text-mist-300">Please select your role in the previous step.</p>
        </SectionCard>
      );
    }

    if (isExistingMemberCoLead) {
      return (
        <SectionCard
          title="Co-Lead · Existing Member"
          subtitle="As an existing G-ELECTRA member applying for Co-Lead, tell us which team you are from and briefly why you want to lead."
        >
          <div className="space-y-4">
            <Textarea
              label="What do you think about us?"
              name="opinion"
              required
              value={draft.opinion}
              onChange={(e) => updateDraft({ opinion: e.target.value })}
              error={localErrors.opinion}
              counter={counterFor('opinion')}
              placeholder="Share your honest perspective on G-ELECTRA…"
            />
            <Textarea
              label="What do you hope to learn or achieve by being a member of this club?"
              name="learningGoals"
              required
              value={draft.learningGoals}
              onChange={(e) => updateDraft({ learningGoals: e.target.value })}
              error={localErrors.learningGoals}
              counter={counterFor('learningGoals')}
              placeholder="Your goals with the club…"
            />
            <Textarea
              label="Why do you want to be a Co-Lead, and what strengths will you bring to the role?"
              name="coLeadMotivation"
              required
              value={draft.coLeadMotivation}
              onChange={(e) => updateDraft({ coLeadMotivation: e.target.value })}
              error={localErrors.coLeadMotivation}
              counter={counterFor('coLeadMotivation')}
              placeholder="Leadership motivation and strengths…"
            />
          </div>
        </SectionCard>
      );
    }

    if (isNonMemberCoLead) {
      return (
        <SectionCard
          title="Co-Lead · Application Questions"
          subtitle="Complete all questions carefully. Character limits are shown for each field."
        >
          <div className="space-y-4">
            <Textarea
              label="What do you think about us?"
              name="opinion"
              required
              value={draft.opinion}
              onChange={(e) => updateDraft({ opinion: e.target.value })}
              error={localErrors.opinion}
              counter={counterFor('opinion')}
            />
            <Textarea
              label="What do you hope to learn or achieve by being a member of this club?"
              name="learningGoals"
              required
              value={draft.learningGoals}
              onChange={(e) => updateDraft({ learningGoals: e.target.value })}
              error={localErrors.learningGoals}
              counter={counterFor('learningGoals')}
            />
            <Textarea
              label="How do you handle conflicts within a team?"
              name="conflictHandling"
              required
              value={draft.conflictHandling}
              onChange={(e) => updateDraft({ conflictHandling: e.target.value })}
              error={localErrors.conflictHandling}
              counter={counterFor('conflictHandling')}
            />
            <Textarea
              label="What improvements or new initiatives would you bring to the club?"
              name="initiatives"
              required
              value={draft.initiatives}
              onChange={(e) => updateDraft({ initiatives: e.target.value })}
              error={localErrors.initiatives}
              counter={counterFor('initiatives')}
            />
            <Textarea
              label="Describe a time you successfully led a team. What was your approach?"
              name="leadershipExperience"
              required
              value={draft.leadershipExperience}
              onChange={(e) => updateDraft({ leadershipExperience: e.target.value })}
              error={localErrors.leadershipExperience}
              counter={counterFor('leadershipExperience')}
            />
            <Textarea
              label="How do you prioritize tasks when managing multiple projects?"
              name="taskPrioritization"
              required
              value={draft.taskPrioritization}
              onChange={(e) => updateDraft({ taskPrioritization: e.target.value })}
              error={localErrors.taskPrioritization}
              counter={counterFor('taskPrioritization')}
            />
            <Textarea
              label="Why do you want to be a co-lead, and what strengths will you bring to the role?"
              name="coLeadMotivation"
              required
              value={draft.coLeadMotivation}
              onChange={(e) => updateDraft({ coLeadMotivation: e.target.value })}
              error={localErrors.coLeadMotivation}
              counter={counterFor('coLeadMotivation')}
            />
          </div>
        </SectionCard>
      );
    }

    // Member flow
    return (
      <SectionCard
        title="Member Application Questions"
        subtitle="Help us understand your motivation, teamwork and commitment."
      >
        <div className="space-y-4">
          <Textarea
            label="What do you think about us?"
            name="opinion"
            required
            value={draft.opinion}
            onChange={(e) => updateDraft({ opinion: e.target.value })}
            error={localErrors.opinion}
            counter={counterFor('opinion')}
          />
          <Textarea
            label="What do you hope to learn or achieve by being a member of this club?"
            name="learningGoals"
            required
            value={draft.learningGoals}
            onChange={(e) => updateDraft({ learningGoals: e.target.value })}
            error={localErrors.learningGoals}
            counter={counterFor('learningGoals')}
          />
          <Textarea
            label="Describe a time when you worked in a team. What role did you play, and how did you contribute to the team's success?"
            name="teamExperience"
            required
            value={draft.teamExperience}
            onChange={(e) => updateDraft({ teamExperience: e.target.value })}
            error={localErrors.teamExperience}
            counter={counterFor('teamExperience')}
          />
          <Textarea
            label="How much time and commitment are you able to dedicate to club activities and events?"
            name="commitment"
            required
            value={draft.commitment}
            onChange={(e) => updateDraft({ commitment: e.target.value })}
            error={localErrors.commitment}
            counter={counterFor('commitment')}
            placeholder="e.g. 6–8 hours per week, available on weekends…"
          />
        </div>
      </SectionCard>
    );
  };

  const renderPhoto = () => (
    <SectionCard
      title="Upload Your Photo"
      subtitle="Your face should be clear and clearly visible."
    >
      <div className="space-y-4">
        <Input
          label="Google Drive Photo Link"
          name="googleDriveUrl"
          required
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          value={draft.googleDriveUrl}
          onChange={(e) => updateDraft({ googleDriveUrl: e.target.value })}
          error={localErrors.googleDriveUrl}
          hint="We do not download or proxy your image. The recruitment team will open the link directly."
        />
        <div className="rounded-xl border border-gold-500/25 bg-gold-500/10 p-4">
          <p className="flex items-start gap-2 text-sm text-gold-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
            <span>
              Make sure the sharing permissions allow the recruitment team to view the image.
              Set access to <strong>Anyone with the link → Viewer</strong>.
            </span>
          </p>
          <details className="mt-3 text-sm text-mist-200">
            <summary className="cursor-pointer font-medium text-gold-200 hover:text-gold-100">
              How to share your Google Drive photo
            </summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-mist-300">
              <li>Upload your photo to Google Drive.</li>
              <li>Right-click the file → Share.</li>
              <li>Change general access to “Anyone with the link”.</li>
              <li>Set role to “Viewer” and copy the link.</li>
              <li>Paste the link above and ensure it opens the image.</li>
            </ol>
          </details>
        </div>
      </div>
    </SectionCard>
  );

  const renderReview = () => {
    const questions: Array<{ step: StepId; label: string; value: string }> = [];
    const labels: Array<[keyof ApplicationDraft, string, StepId]> = [
      ['opinion', 'What do you think about us?', 'questions'],
      ['learningGoals', 'Learning goals', 'questions'],
      ['conflictHandling', 'Conflict handling', 'questions'],
      ['initiatives', 'Initiatives', 'questions'],
      ['leadershipExperience', 'Leadership experience', 'questions'],
      ['taskPrioritization', 'Task prioritization', 'questions'],
      ['coLeadMotivation', 'Co-Lead motivation', 'questions'],
      ['teamExperience', 'Team experience', 'questions'],
      ['commitment', 'Commitment', 'questions'],
    ];

    for (const [key, label, stepId] of labels) {
      const val = String(draft[key] ?? '').trim();
      if (val) questions.push({ step: stepId, label, value: val });
    }

    return (
      <div className="space-y-4">
        <SectionCard
          title="Review Your Application"
          subtitle="Please check every section carefully before submitting."
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
              <Check className="h-3 w-3" aria-hidden="true" /> Ready
            </span>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-ink-900/50 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Personal Details</h3>
                <button
                  type="button"
                  onClick={() => goToStep(0)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gold-300 ring-1 ring-gold-500/30 hover:bg-gold-500/10"
                >
                  Edit
                </button>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-mist-400">Full Name</p>
                  <p className="text-white">{draft.fullName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-mist-400">Registration Number</p>
                  <p className="text-white">{draft.registrationNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-mist-400">Contact Number</p>
                  <p className="text-white">{draft.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-mist-400">Email</p>
                  <p className="break-all text-white">{draft.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-mist-400">Academic Year</p>
                  <p className="text-white">
                    {draft.academicYear ? ACADEMIC_YEAR_LABELS[draft.academicYear] : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-mist-400">Branch</p>
                  <p className="text-white">
                    {draft.branch ? BRANCH_LABELS[draft.branch] : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-ink-900/50 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Application</h3>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gold-300 ring-1 ring-gold-500/30 hover:bg-gold-500/10"
                >
                  Edit
                </button>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-mist-400">Portfolio</p>
                  <p className="text-white">
                    {draft.portfolio ? PORTFOLIO_LABELS[draft.portfolio] : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-mist-400">Role</p>
                  <p className="text-white">
                    {draft.role ? ROLE_LABELS[draft.role] : '—'}
                  </p>
                </div>
                {draft.role === ROLE.CO_LEAD ? (
                  <>
                    <div>
                      <p className="text-xs text-mist-400">Existing G-ELECTRA Member</p>
                      <p className="text-white">
                        {draft.existingMember === true
                          ? 'Yes'
                          : draft.existingMember === false
                            ? 'No'
                            : '—'}
                      </p>
                    </div>
                    {draft.existingTeam ? (
                      <div>
                        <p className="text-xs text-mist-400">Existing Team</p>
                        <p className="text-white">
                          {EXISTING_TEAM_LABELS[draft.existingTeam]}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {questions.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-ink-900/50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Application Answers</h3>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gold-300 ring-1 ring-gold-500/30 hover:bg-gold-500/10"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.label}>
                      <p className="text-xs text-mist-400">{q.label}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-white">{q.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-ink-900/50 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Photo Link</h3>
                <button
                  type="button"
                  onClick={() => goToStep(4)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gold-300 ring-1 ring-gold-500/30 hover:bg-gold-500/10"
                >
                  Edit
                </button>
              </div>
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                <a
                  href={draft.googleDriveUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm text-gold-300 hover:underline"
                >
                  {draft.googleDriveUrl || '—'}
                </a>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Confirm & Submit">
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
              confirmChecked
                ? 'border-gold-500/40 bg-gold-500/10'
                : localErrors.confirm
                  ? 'border-rose-500/40'
                  : 'border-white/10 hover:border-white/20',
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-ink-850 text-gold-500 focus:ring-gold-500/40"
              checked={confirmChecked}
              onChange={(e) => {
                setConfirmChecked(e.target.checked);
                setLocalErrors((prev) => ({ ...prev, confirm: '' }));
              }}
            />
            <span className="text-sm text-mist-100">
              I confirm that the information provided by me is accurate.
            </span>
          </label>
          {localErrors.confirm ? (
            <div className="mt-2">
              <FormFieldError message={localErrors.confirm} />
            </div>
          ) : null}

          {networkError ? (
            <div
              className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
              role="alert"
            >
              <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">We could not submit your application</p>
                <p className="mt-1">{networkError}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <Button
              type="button"
              onClick={onSubmitReview}
              loading={submitting}
              disabled={submitting}
              fullWidth
              size="lg"
              leftIcon={<FileCheck2 className="h-4 w-4" />}
            >
              {submitting ? 'Submitting application…' : 'SUBMIT APPLICATION'}
            </Button>
            <p className="text-center text-xs text-mist-400">
              You will receive an application ID after successful submission. Save it for your
              records.
            </p>
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-mist-400">
              By submitting, you agree that G-ELECTRA may contact you about recruitment and store
              the details you provide for club use only. Your information is not shared outside the
              club team.
            </p>
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderSuccess = () => (
    <SectionCard className="text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mx-auto max-w-lg"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 16 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-ink-900"
          >
            <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
          </motion.span>
        </div>
        <h2 className="mt-6 font-display text-2xl font-extrabold text-white sm:text-3xl">
          APPLICATION SUBMITTED
        </h2>
        <p className="mt-3 text-mist-200">
          Your application has been successfully received.
        </p>

        <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-gold-300">Application ID</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-wider text-white">
            {submittedId}
          </p>
          <p className="mt-3 text-sm text-mist-200">
            Status: <span className="font-medium text-gold-200">Submitted</span> — save this ID for
            your records.
          </p>
          {emailSent === true ? (
            <p className="mt-2 text-sm text-emerald-200">
              Confirmation email sent to your registered email address.
            </p>
          ) : emailSent === false ? (
            <p className="mt-2 text-sm text-amber-200">
              Your application is saved. Email confirmation may be delayed — keep your ID safe.
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-sm text-mist-300">
          We will review your application and communicate further updates through your registered
          email.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gold-linear px-6 text-sm font-bold text-ink-900"
          >
            Return Home
          </Link>
        </div>
      </motion.div>
    </SectionCard>
  );

  // Success page — driven by submittedId (STEPS has no 'success' entry)
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-ink-900 font-body">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-8 flex justify-center">
            <img src={LOGO_PATH} alt={LOGO_ALT} className="h-16 w-16 rounded-full object-contain" />
          </div>
          {renderSuccess()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900 font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400"
          >
            <img
              src={LOGO_PATH}
              alt={LOGO_ALT}
              className="h-10 w-10 shrink-0 rounded-full object-contain"
              width={40}
              height={40}
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold tracking-[0.16em] text-gold-400">
                {CLUB_NAME}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-mist-300">
                {CLUB_TAGLINE}
              </span>
            </span>
          </Link>
          <Link
            to="/"
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-mist-200 transition hover:text-gold-300"
          >
            <span className="hidden sm:inline">← Back to site</span>
            <span className="sm:hidden">← Back</span>
          </Link>
        </div>
      </header>

      <main
        className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10"
        style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
      >
        {/* Sticky progress on mobile */}
        <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-white/5 bg-ink-900/95 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-ink-850/80 sm:px-5">
          <ProgressBar
            current={Math.min(stepIndex + 1, STEPS.length)}
            total={STEPS.length}
            label={STEPS[stepIndex]?.label ?? 'Application'}
          />
          {lastSaved ? (
            <p className="mt-2 text-[11px] text-mist-500">
              Draft saved on this device · {new Date(lastSaved).toLocaleTimeString()}
            </p>
          ) : null}
        </div>

        <div className="mb-6 hidden items-center gap-2 overflow-x-auto pb-1 md:flex">
          {STEPS.map((s, i) => {
            const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo';
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (i < stepIndex) goToStep(i);
                }}
                disabled={i > stepIndex}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition',
                  state === 'current' && 'bg-gold-500/15 text-gold-200 ring-1 ring-gold-500/30',
                  state === 'done' && 'bg-emerald-500/10 text-emerald-300',
                  state === 'todo' && 'bg-white/5 text-mist-400',
                  i <= stepIndex && 'cursor-pointer',
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 font-mono text-[10px]">
                  {state === 'done' ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {currentStep === 'personal' && renderPersonal()}
            {currentStep === 'portfolio' && renderPortfolio()}
            {currentStep === 'role' && renderRole()}
            {currentStep === 'questions' && renderQuestions()}
            {currentStep === 'photo' && renderPhoto()}
            {currentStep === 'review' && renderReview()}
          </motion.div>
        </AnimatePresence>

        {/* Bottom nav */}
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/95 px-4 py-3 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-4xl gap-3">
            {stepIndex > 0 && currentStep !== 'review' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                className="flex-1"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
            ) : null}
            {currentStep !== 'review' ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-[2]"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                className="flex-1"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to review
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
