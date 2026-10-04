# Workspace training pipeline

Submit Solution / Submit PR opens the five-stage drawer immediately. Stages show status, elapsed time and streamed client log lines. Logs can be collapsed/copied; auto-scroll can be disabled. Skip Animation removes remaining presentation delays and still waits for backend review. Reduced-motion preferences suppress spinner/celebration animation.

Static readiness and a limited hardcoded-credential rule run locally. Compiler lint, dependency scanning, test results/88% coverage and Docker/staging are explicitly labelled simulations. No uploaded code is executed and no staging website is deployed. Invalid starter code or suspected embedded credentials stops before submission. There is no invented offline approval: failed backend requests fail the pipeline without completing the ticket.

Code snippets and legacy PR URLs use the existing enrollment/ticket status API. Backend `DONE` determines success; feedback and score come from that response. Connected GitHub workspaces use repo sync followed by workspace refresh and require an approved PR explicitly linked to the selected ticket. The GitHub workspace API now includes `ticket_id` on PR records. Pending AI setup, changes requested or unmatched PRs fail the review stage and leave deployment queued.

On approval, the sprint completion counter, percentage and rolling seven-day velocity (completed tickets, using backend completion timestamps) refresh. The success panel offers Open next ticket for the first remaining TODO ticket. Existing workspace ticket access rules are unchanged; this feature does not introduce new ticket locking. Fix Code returns to the existing editor; Re-run retries the same immutable submitted snapshot.

Components are in `frontend/src/components/workspace/`. The runner guards against duplicate React Strict Mode submissions and ignores state updates after unmount. The dialog traps keyboard focus, restores focus/scroll on close and can be dismissed after the run completes. Backend requests are not cancelled by Skip Animation.

Frontend dev server picks up the UI automatically. To activate the GitHub API response change, build/restart from the PowerShell terminal containing your AI/GitHub environment variables:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Build -RestartBackend
```

No extra API key or new backend endpoint is required. Existing Gemini/GitHub configuration continues to apply.
