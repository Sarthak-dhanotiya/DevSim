# GitHub workflow

## Start locally without re-entering credentials

Edit `C:\virtualcompany\.env` once, then double-click `Start-DevSim.cmd`.
The launcher loads `.env` into the backend process and restarts the local backend.
This also works with `scripts/start-local.ps1`; running Java directly from an IDE
does not use this loader. `.env` values override the launching terminal's values.
Use one `NAME=value` per line, with optional matching quotes. Put comments on their
own lines; values are literal and shell expressions are never evaluated.

Required OAuth values: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and
`GITHUB_CALLBACK_URL=http://localhost:3000/github/callback`. The token encryption
key is automatically loaded from `%LOCALAPPDATA%\DevSim\github-token-key.xml`
when `GITHUB_TOKEN_KEY` is unset. That Windows-encrypted file must be read by the
original Windows account on the original machine. Alternatively supply the
original Base64 key in `.env`; never regenerate it on each startup.

`.env` is ignored by Git. Optional Gemini, review-bot, template and webhook
settings are documented in `.env.example`. Frontend build variables still belong
in `frontend/.env.local`. Render needs its own environment settings and cannot
read the Windows-encrypted key file.

## Local configuration

Create a GitHub **OAuth App** in Settings → Developer settings. Homepage: `http://localhost:3000`. Authorization callback: **`http://localhost:3000/github/callback`**. Set the following in the same PowerShell terminal used to start DevSim. Enter secrets at the prompt; do not paste them into chat or commit them.

```powershell
$env:GITHUB_CLIENT_ID = Read-Host 'OAuth client ID'
$env:GITHUB_CLIENT_SECRET = Read-Host 'OAuth client secret'
# Generate once; save securely and reuse across restarts. Changing this key requires reconnecting accounts.
$githubKeyBytes = New-Object byte[] 32
$githubRng = [Security.Cryptography.RandomNumberGenerator]::Create()
$githubRng.GetBytes($githubKeyBytes)
$githubRng.Dispose()
$env:GITHUB_TOKEN_KEY = [Convert]::ToBase64String($githubKeyBytes)
$env:GEMINI_API_KEY = Read-Host 'Gemini API key'
$env:GEMINI_MODEL = 'gemini-3.8-flash'
# Optional: public template repository marked as a template on GitHub.
$env:GITHUB_TEMPLATE_REPO = 'your-account/your-template'
$env:GITHUB_REPO_MODE = 'TEMPLATE' # or FORK for a public source repository
```

Without a template, provisioning creates a real public repository with a starter README and `DEVSIM.md` containing the assigned tickets. It does not invent a working implementation of those tickets. All project repos are public; do not submit secrets. Repository names include the enrollment ID suffix to avoid collisions. After creation, `devsim/start` is initialized; ticket branches use `feature/<exact-ticket-key>`. Existing template source files are preserved.

## Bot identity

Create a **GitHub App** with repository permissions: Contents **Read**, Pull requests **Read & write**, Metadata **Read**. Install it on each student repository after provisioning. Set:

```powershell
$env:GITHUB_APP_ID = Read-Host 'GitHub App numeric ID'
$env:GITHUB_APP_SLUG = 'your-app-slug' # enables the Install Bot link in the UI
$env:GITHUB_APP_PRIVATE_KEY_FILE = 'C:\secure\devsim-app-pkcs8.pem'
```

The private key must be unencrypted PKCS#8 (`BEGIN PRIVATE KEY`). Convert GitHub's downloaded PKCS#1 key if necessary:

```text
openssl pkcs8 -topk8 -nocrypt -in downloaded-app-key.pem -out devsim-app-pkcs8.pem
```

The backend generates short-lived installation tokens scoped to the student's repository and posts as `<app-slug>[bot]`. A separate bot account's PAT can alternatively be supplied as `GITHUB_BOT_TOKEN`; that account must have repository write access. Never use the student's OAuth token as a pretend bot. If the App is not installed or AI credentials/quota are unavailable, the UI shows `SETUP_REQUIRED` or `RETRY_REQUIRED`; no fabricated review or completion is recorded.

## Webhooks

GitHub cannot call `localhost`. Expose port 8080 through a HTTPS tunnel and set:

```powershell
$env:GITHUB_WEBHOOK_URL = 'https://YOUR-TUNNEL/api/v1/github/webhook'
$env:GITHUB_WEBHOOK_SECRET = Read-Host 'A long random webhook secret'
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Build -RestartBackend
```

Do this in the terminal that contains your AI/GitHub environment variables. OAuth uses the local frontend callback; only webhook deliveries require a public backend URL. OAuth requests `repo`, `read:user`, and `admin:repo_hook`; GitHub displays these permissions on consent. Connecting is separate from DevSim login.

Webhook signatures are verified over raw bytes using HMAC-SHA256. Delivery IDs are deduplicated in a durable database queue. Processing retries up to five times. Slow AI requests do not hold open GitHub's delivery request. Only repositories bound to an enrollment are processed. Without a tunnel, **Sync PRs** provides a manual trigger for automatic PR discovery/review; the open UI refreshes stored status every 30 seconds. Push alone does not create a PR: students push their branch and open a PR on GitHub.

## UI walkthrough

1. Profile → Connect GitHub → authorize → connected account/avatar appears.
2. Workspace → Setup GitHub Workspace → public repo, ticket instructions and initial branch are created.
3. Install the review GitHub App on that repo. Clone using the displayed command.
4. Select the ticket branch command, implement changes, push, and open a PR against the default branch. Branch must be `feature/<ticket-key>` or `feature/<ticket-key>-description`.
5. A webhook or Sync PRs links PRs authored by the connected account from that exact repo and marks the matching ticket `IN_REVIEW`. Unrelated PRs are ignored.
6. Gemini reviews changed files against ticket acceptance criteria. Valid line comments and a summary are posted as a COMMENT review; DevSim never auto-merges. AI approval marks the ticket `DONE` (the existing platform's completed status). New commits invalidate previous approval.
7. Merge the approved PR on GitHub, then sync. My verified portfolio shows repository, PR and head commit links. A verified badge requires both AI approval for the current head and a real merge. This is participation evidence, not independent certification or CI verification.
8. Public verified evidence is available at `/developers/<DevSim-user-UUID>`. The builder's existing `/portfolio` page is preserved. `DeveloperPortfolio` accepts `studentId` to render student evidence.

Disconnect removes the encrypted access token and account data from DevSim. Revoke the OAuth App in GitHub settings too if you want to revoke GitHub authorization; existing repositories are not deleted.

## Scope and limitations

Super Admin project creation supports a per-project template repository and TEMPLATE/FORK mode; the environment template is a fallback. The first 100 PRs/files/reviews are considered; large or incomplete diffs are not approved. Binary-only and missing diffs cannot pass. AI is Gemini; an OpenAI reviewer is not wired. Commit evidence links point to real GitHub commits; the portfolio lists PR commit history; a graphical commit calendar is not implemented. Changing the connected GitHub account does not migrate old repositories. Template/fork generation can be asynchronous: use Repair README / webhook after a transient setup error. Provisioned repo bindings persist if later setup fails, so repair does not create a second repo.

API: `GET account`, `GET auth-url`, authenticated `POST callback`, `DELETE disconnect`, `POST projects/{id}/provision-repo`, `POST projects/{id}/setup`, `GET projects/{id}`, `POST projects/{id}/sync`, signed public `POST webhook`, `GET portfolio`, public `GET portfolio/{userId}` under `/api/v1/github`. Callback requires the logged-in DevSim JWT and a short-lived, user-bound PKCE state. OAuth tokens are AES-256-GCM encrypted and never returned to the frontend.
