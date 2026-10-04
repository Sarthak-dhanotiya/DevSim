# Personalized student journeys

## Local app

- Frontend: http://localhost:3000
- Student onboarding: http://localhost:3000/onboarding
- Super admin: http://localhost:3000/super-admin
- Backend: http://localhost:8080

The existing PostgreSQL service on localhost:5432 is used by the development configuration. Flyway applies V7 and V8 additively. Docker Compose is an alternative on port 5433; when using it, set `DB_PORT=5433`, `DB_USER=postgres` and `DB_PASSWORD=postgrespassword` before starting the backend.

From the workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Build
```

Backend/frontend run in hidden background processes. Logs are in `.local/`. The script does not start PostgreSQL. Install frontend dependencies with `npm.cmd install` in `frontend` if needed. Java 21, Maven and Node are required. The workspace Maven cache is `.m2/`.

## Student flow

1. Register with a name, email and chosen password. This flow does not send credential emails. Registration signs the student in and opens onboarding.
2. Upload a text-based PDF, DOCX or TXT resume, or enter skills manually. The server extracts known skill keywords, discards the file, and stores only the file name, skill list and summary. No resume is transmitted to an AI provider. Limit: 5 MB, PDF maximum 20 pages. Scanned PDFs require external OCR or manual skill entry.
3. Confirm/edit skills. Choose a career track, goal, weekly availability and experience level.
4. Choose **AI recommended setup** for immediate assignment, or **Request guided assignment** for an admin review.
5. Complete three engineering questions and a small active-record filtering task in any language or pseudocode. The question answers and code patterns produce a provisional score. The code is not executed. Initial level is capped at intermediate and respects the self-selected beginner level.
6. Compare up to three projects. Match scores use career track, skill overlap and starting difficulty; they are deterministic suitability scores, not probabilities. Choose a project and create the workspace or submit a guided request.
7. Open the workspace. Each assignment starts with three private personalized tickets. Start a ticket, read acceptance criteria, use progressive hints and submit implementation plus test code.
8. After finishing the sprint, refresh journey progress and select **Unlock next sprint**. Difficulty uses persisted review scores, revision attempts and hint usage. Current sprint completion is checked on the server.
9. **Export evidence** downloads a Markdown file of completed tickets, project names, criteria, review scores and feedback. It includes the verification limits.

Onboarding is required for signed-in students, including existing accounts. Draft goal/skills are saved when continuing past the direction step; resume extraction and assessment are separately persisted. Guided pending students can view their request status. Rejected requests reopen onboarding with the admin's feedback.

While a guided request is pending, every other student route redirects to the onboarding waiting screen. Previous enrollments are hidden and workspace, hint, ticket changes and mentor access are denied until admin approval. V9 locks existing pending profiles. After approval, **Refresh status** updates both the waiting page and session permissions.

## Admin flow

The seeded development super admin is `superadmin@devsim.com`, password `password123` (existing V6 seed). Use this only in local development.

- Guided requests appear at the top of `/super-admin`, with goals, skills, starter submission, availability and provisional assessment.
- Select a project, add feedback and approve. The server enrolls the student and creates private tickets atomically.
- Request changes with a required explanation. The student's onboarding becomes mandatory again.
- Use the existing project creation form to add projects. **Independent project (no company)** is supported. Career track and business brief remain required. Technologies are correctly mapped to the backend `technologies` field.
- Project descriptions should include domain resources, milestones, expected deliverables, setup instructions and an optional real starter repository URL.

Catalog additions: CareFlow Appointment API, LearnSpace Student Portal, SpendWise Expense Service and StockPilot Inventory Service. Frontend and Python career tracks are added alongside Java. These are project briefs, not bundled complete repositories. Workspace starter templates adapt to Java, React/TypeScript and Python.

## AI configuration and costs

Resume extraction and recommendation scoring need **no API key** and no paid service. Without a key, tickets use level-specific project templates and mentoring uses built-in guidance. Tickets record `BUILT_IN`, `GEMINI` or `CURATED` so fallback is visible.

Live generation, arbitrary mentor answers and model-based submission feedback use a server-side Gemini key:

```powershell
$env:GEMINI_API_KEY='YOUR_KEY'
$env:GEMINI_MODEL='gemini-2.5-flash'
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -RestartBackend
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). See [official Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) for eligible free-tier models and current quotas; free usage is limited and account/model availability can vary. `GEMINI_MODEL` is configurable. Never put the key in frontend code or commit it. Restart the backend after changing environment variables.

Only confirmed skills, goals, project context and submitted code/questions are used in AI requests. Resume files are never sent. Requests have connection/read timeouts. Invalid responses/provider failures fall back to templates. `GEMINI_CONFIGURED` means a key exists, not that it has been tested successfully; individual ticket source indicates whether generation actually used Gemini.

## Verification and limits

- `mvn.cmd "-Dmaven.repo.local=C:/virtualcompany/.m2/repository" -f backend/pom.xml test`: parser extraction, PDF/DOCX, XXE/size/format rejection, assessment validation, duplicate assignment and workflow checks.
- `npx.cmd tsc --noEmit` in `frontend`: TypeScript validation.
- `npm.cmd run build` in `frontend`: production build (set `NEXT_BUILD_DIR=.next-build` while the dev server is running).
- `node scripts/journey-smoke.cjs`: local integration flow. Creates clearly named smoke users and a standalone smoke project. Uses seeded local admin credentials unless `DEVSIM_ADMIN_EMAIL` / `DEVSIM_ADMIN_PASSWORD` are set. Results go to `.local/journey-smoke-report.json`; the last automatic test account is saved in ignored `.local/demo-account.json`.

No sandboxed execution of student code, GitHub import/PR creation, real merges or independently verified test results are implemented. Submission review is advisory/model-based or pattern-based. A passing review advances simulation progress; it is not a certification. Code execution would require an isolated worker/container system. Arbitrary live AI outputs require a configured, working provider key. Browser visual QA could not run because no browser was connected; routes, builds and API flows are verified separately.
