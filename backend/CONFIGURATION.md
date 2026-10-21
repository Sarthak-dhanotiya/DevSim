# Running the backend from an IDE

`src/main/resources/application.properties` maps environment variables to Spring
settings. `application-prod.properties` contains production-only overrides. The
old YAML files contain comments only. Credentials belong in the root `.env`,
which is ignored by Git. `.env.example` documents every supported setting.

## One-time setup

1. Use the existing root `.env`. For a fresh checkout, copy `.env.example` to
   `.env` and fill `DB_PASSWORD` and `JWT_SECRET` (a private random secret of at
   least 32 bytes). Set the actual PostgreSQL port: native installations normally
   use 5432; this repository's Docker setup uses 5433.
2. For live AI, fill `GEMINI_API_KEY` and `GEMINI_MODEL` using a model available
   to your account. For SMTP, fill `SPRING_MAIL_USERNAME`,
   `SPRING_MAIL_PASSWORD` (a Gmail App Password when using Gmail), and `MAIL_FROM`.
3. In your IDE, create a Spring Boot / Java run configuration for
   `com.virtualcompany.VirtualCompanyApplication`, using Java 21 and the backend
   module classpath.
4. In the run configuration's environment-file option, select the absolute path
   to the repository root `.env` (for this checkout, `C:/virtualcompany/.env`).
   If your IDE does not support environment files, use its env-file integration
   or copy the active `NAME=value` entries into its Environment variables editor.
   Do not put the file path into the Environment variables field as a variable.
5. Stop any other backend using port 8080, then Run. Restart the run configuration
   after editing environment variables; running JVMs keep their startup values.

Spring Boot does not load `.env` automatically. The IDE must inject it. No
PowerShell launcher is needed when your IDE supplies these environment variables.
The existing `scripts/start-local.ps1` remains available and loads the same file.
The frontend's own local environment file remains `frontend/.env.local`.

## Optional integrations and production

- GitHub OAuth needs `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, callback URL,
  and `GITHUB_TOKEN_KEY`. Keep the existing encryption key: rotating it makes
  stored tokens unreadable. IDE launches read the key from `.env`; they do not
  read the Windows encrypted key file used by the PowerShell launcher.
- Resend can be configured with `RESEND_API_KEY` and `RESEND_FROM`.
- GitHub App, bot, template, and webhook settings are grouped in `.env.example`.
- Leave `SPRING_DATASOURCE_URL` commented out unless supplying a full JDBC URL.
  An empty value overrides the generated URL and breaks the database connection.
- For deployment, inject variables through the hosting platform, select
  `SPRING_PROFILES_ACTIVE=prod`, and set the frontend URL, CORS origins, and DB
  credentials. Production database URLs default to `sslmode=require`.
- `PORT` takes precedence over `SERVER_PORT` for hosting compatibility.

Existing local credentials were preserved during migration. Original configuration
files are backed up under `.local/config-backup-*` (ignored by Git).
