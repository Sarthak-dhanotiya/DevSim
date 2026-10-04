# First day at DevSim

Registration remains one short form with name, email and password, password visibility and a first-day preview. The new account is authenticated but must verify its email before creating a workspace or enrolling in a project. Existing accounts are backfilled as verified by V12; they do not repeat verification.

The authenticated email endpoints are `/api/v1/journey/email`, `/send` and `/verify`. Codes expire in ten minutes, five guesses are allowed per code and resends have a 60-second cooldown. Codes are bound to the user, hashed at rest and never returned or logged. Incorrect attempts commit before returning an error so retries cannot reset the counter. Delivery uses the existing SMTP/Resend email configuration. Configure a working sender before accepting new registrations; the UI reports that delivery was requested and provides resend/retry, rather than claiming delivery succeeded. No emails are sent in automated tests.

Onboarding steps: starting-point experience cards → resume/manual skills/GitHub connection → career goal/track/weekly availability → optional challenge → project recommendation and automated/admin-guided choice. The challenge keeps the existing fixed-answer/basic-pattern assessment; it is not executed code or certification. Skip is persisted separately, without inventing a score; skipped assessments start at beginner difficulty. Completed/pending journeys cannot change the assessment. The common engineering questions and active-record task apply to the chosen stack; separate question banks for each track are not implemented.

Drafts save under an account-specific localStorage key on every change. Once skills, goal and track are valid, a debounced server save persists the profile preferences. Pending saves are awaited before assessment/completion. Partial drafts and challenge answers resume on the same browser; complete skills/goal/preferences sync across browsers. Passwords, verification codes and resume file contents are not stored in the draft. Submitted drafts are removed locally.

The welcome kit shows a simulation employee card, chosen company/project, confirmed skills, learning targets, availability and the first real assigned ticket. A First-Day Brief is available in the dashboard/workspace journey panel. Guided requests show pending status and keep workspace access gated until approval. GitHub is connected after account creation; this release does not add GitHub as a primary DevSim sign-up method.

Activate the backend from the terminal that already contains your AI/GitHub/mail environment variables:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Build -RestartBackend
```

V12 applies on startup. Open `http://localhost:3000/register` and use an email inbox you control. Request the verification code, finish or skip the challenge, choose a project and start your first day. Existing users can visit `/onboarding` to view their welcome kit.
