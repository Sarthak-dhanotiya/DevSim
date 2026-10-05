# Personalized onboarding challenges

The first-day challenge now loads from `POST /api/v1/journey/challenge` after profile synchronization. Gemini uses the configured `GEMINI_API_KEY` and `GEMINI_MODEL`. No additional API key is required.

Inputs: confirmed skills, selected career track, experience level, learning goal, weekly availability, and extracted technical resume summary. Upload a resume again to populate technical experience summaries from older uploads. The original file is discarded; extracted technical summaries are stored and can be sent to Gemini. Common contact lines are omitted from extracted experience snippets.

A profile fingerprint and private challenge JSON are stored on the journey by Flyway V13. Question order/answer options stay stable across refreshes. Profile changes invalidate prior scores and reject stale submissions. Browser responses contain question options, task criteria and source, never correct-answer indices. Answers and task drafts resume on the same browser.

Gemini requests have a 25-second read timeout, bounded output and schema validation. Missing credentials, quota/provider errors or invalid output use skill-specific curated fallback questions. The UI labels the source. Up to 3 weekly hours gives 2 questions; otherwise 3. Hours change scope, not difficulty. A saved fallback is reused; changing the relevant profile generates a fresh challenge.

The provisional score comes only from server-graded knowledge questions. The design/code response is saved for mentoring and is not executed, certified or scored. Optional skip remains available and starts conservatively.

## Run locally

In the user's PowerShell terminal that already contains the Gemini environment variables:

```powershell
cd C:\virtualcompany
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Build -RestartBackend
```

Open http://localhost:3000/onboarding. Complete/confirm the profile, enter First-day challenge, and check the source badge. Navigate back to alter React vs Redis/Kafka skills or weekly hours and continue to generate a different challenge. Refresh to confirm the same challenge persists. Existing assigned students retain their assignment; this feature is for draft onboarding.

Verification: backend unit tests, frontend production build/type checking, and a temporary local 8081 API smoke verified persisted challenges, answer privacy, profile-based topic/scope changes and stale submission rejection. Live Gemini generation requires credentials in the launched backend environment and was not exercised in the agent shell.
