# Admin User Manual

This guide covers the G-ELECTRA Admin Portal for recruitment coordinators.

## Access

### Authorized Admin Emails

Only the following Google accounts can access the admin portal:

- `hello@dotfreelancer.in`
- `gelectra@gitam.edu`

To add a new admin, an existing admin must update the allowlist in `src/constants/index.ts` (redeploy required) or the Firestore `settings` document.

### Signing In

1. Navigate to `/admin`
2. Click **Sign in with Google**
3. Choose an authorized Google account
4. You'll be redirected to the dashboard

If you see **"Access denied"**, your Google account email is not in the allowlist.

## Dashboard (`/admin/dashboard`)

The dashboard shows a live overview:

- **Total Applications** — all non-archived submissions
- **Member vs Co-Lead** — role distribution
- **Existing Members vs New Applicants**
- **Status breakdown** — submitted / reviewed / shortlisted / rejected
- **Portfolio distribution** — pie chart by team
- **Trend chart** — applications over time

All data updates in real-time from Firestore.

## Applications List (`/admin/applications`)

### Viewing Applications

The list shows all applications sorted by submission date (newest first). Each row displays:

- Applicant name and Application ID
- Registration number
- Portfolio and role
- Status badge
- Submission date

### Filtering

Use the filter bar to narrow results:

- **Search** — name, registration number, email, Application ID, or phone
- **Portfolio** — filter by team
- **Role** — Member or Co-Lead
- **Status** — Submitted, Reviewed, Shortlisted, Rejected
- **Academic Year** — 1st through 4th year
- **Branch** — CSE, ECE, etc.
- **Existing Member** — Yes/No
- **Date Range** — from/to date pickers

### Pagination

The list loads 20 applications per page. Use **Load More** to fetch the next page.

## Application Detail (`/admin/applications/:docId`)

Click any application row to open the full detail view:

### Information Sections

1. **Applicant Info** — name, reg number, phone, email, year, branch
2. **Application Info** — portfolio, role, existing member status, current team
3. **Photo** — Google Drive photo link (opens in new tab)
4. **Answers** — all submitted text answers
5. **Metadata** — userAgent, submission timestamp, status change history
6. **Email Status** — pending/sent/failed + last attempt time

### Changing Status

1. Open the application detail page
2. Find the **Status** section
3. Select a new status from the dropdown:
   - **Submitted** — initial state
   - **Reviewed** — application has been reviewed
   - **Shortlisted** — candidate moved to next round
   - **Rejected** — candidate not selected
4. Click **Update Status**

The status is updated in Firestore and a notification email is sent to the applicant.

### Resending Confirmation Email

If an applicant didn't receive their confirmation:

1. Open the application detail page
2. Click **Resend Confirmation Email**
3. The system re-sends the branded confirmation email

### Archiving

To remove an application from the active list (without deleting data):

1. Open the detail page
2. Click **Archive Application**
3. The application is flagged `archived: true` and hidden from all lists

## Analytics (`/admin/analytics`)

Deep-dive analytics with additional charts:

- Portfolio comparison (bar chart)
- Branch distribution
- Academic year breakdown
- Role split over time
- Status funnel visualization

## Exports (`/admin/exports`)

### Export All Applications

Generates `G-ELECTRA-Recruitment-2026.xlsx` containing:

- **Summary** sheet — key statistics
- **All Applications** sheet — every application with all fields
- **Per-team sheets** — Marketing, Content, Creative Design, Web Developer, Hardware, Software

### Export by Portfolio

Generates a single-sheet file for one team: `G-ELECTRA-{Team}-2026.xlsx`

### Excel Columns

| Column | Description |
|--------|-------------|
| Application ID | GE26-XXXXX |
| Full Name | Applicant name |
| Registration Number | GITAM reg number |
| Phone | Contact number |
| Email | Registered email |
| Academic Year | 1st–4th year |
| Branch | Department |
| Portfolio | Selected team |
| Role | Member or Co-Lead |
| Status | Current status |
| Submitted | Date/time |
| Key Answers | Opinion, learning goals, etc. |

## Settings (`/admin/settings`)

View and manage:

- Club name, department, university
- Recruitment year
- Authorized admin emails
- Application status options

> Settings changes require a code redeploy for the allowlist to take effect.

## Best Practices

1. **Review regularly** — check the dashboard daily during recruitment
2. **Update statuses promptly** — applicants receive email notifications
3. **Export backups** — download Excel backups weekly
4. **Archive carefully** — archiving hides applications from lists (not deleted)
5. **Secure access** — only share admin credentials with authorized coordinators

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't sign in | Verify your Google account email is in the allowlist |
| Applications not loading | Check internet connection; Firestore rules must allow admin read |
| Email not sending | Check Cloud Functions logs; verify Gmail app password |
| Export fails | Ensure all applications have required fields; try a smaller date range |
| Status update fails | Ensure you're signed in as an authorized admin |
