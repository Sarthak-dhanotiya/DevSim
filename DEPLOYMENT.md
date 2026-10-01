# Zero-Cost Production Deployment Guide (No AWS Required)

This guide walks you through deploying the complete **DevSim / Virtual Company Platform** to the public internet for **100% free** using modern cloud platforms:

| Layer | Service | Cost |
| :--- | :--- | :--- |
| **PostgreSQL Database** | [Neon.tech](https://neon.tech/) | Free Tier (Serverless Postgres) |
| **Backend (Spring Boot 3 / Java 21)** | [Render.com](https://render.com/) or [Railway.app](https://railway.app/) | Free Web Service Tier |
| **Frontend (Next.js 14)** | [Vercel.com](https://vercel.com/) | Free Hobby Tier |

---

## Step 1: Push Code to GitHub

1. Open PowerShell / Terminal in `c:/virtualcompany`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Virtual Company Platform MVP"
   ```
2. Create a new repository on [GitHub](https://github.com/new) (e.g. `virtualcompany`).
3. Link and push your local repository:
   ```bash
   git remote add origin https://github.com/<your-username>/virtualcompany.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Set Up Free Cloud PostgreSQL on Neon.tech

1. Go to [Neon.tech](https://neon.tech/) and sign up with your GitHub account.
2. Click **"Create Project"**:
   - Project Name: `virtualcompany-db`
   - Region: Select nearest region (e.g. `US East (Ohio)` or `Asia Pacific (Singapore)`).
   - Postgres version: `16` (Default).
3. On the project dashboard, locate the **Connection Details** box.
4. Note down:
   - **Host:** e.g. `ep-cool-sample.us-east-2.aws.neon.tech`
   - **Database:** `neondb`
   - **User:** e.g. `neondb_owner`
   - **Password:** `<your-generated-password>`
   - **SSL Mode:** `require`

---

## Step 3: Deploy Backend on Render.com

1. Sign up on [Render.com](https://render.com/) with GitHub.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository `virtualcompany`.
4. Configure the Web Service settings:
   - **Name:** `virtualcompany-backend`
   - **Region:** Same region as your Neon database.
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` *(Render will automatically find `backend/Dockerfile`)*
   - **Instance Type:** `Free`
5. Scroll down to **Environment Variables** and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates `application-prod.yml` |
| `DB_HOST` | `ep-cool-sample.us-east-2.aws.neon.tech` | Your Neon Host |
| `DB_PORT` | `5432` | Standard Postgres Port |
| `DB_NAME` | `neondb` | Neon Database Name |
| `DB_USER` | `neondb_owner` | Neon DB Username |
| `DB_PASSWORD` | `<your-neon-password>` | Neon DB Password |
| `DB_SSL_MODE` | `require` | Enforces SSL encryption |
| `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 64-char Secret Key |
| `CORS_ALLOWED_ORIGINS` | `https://*.vercel.app,http://localhost:3000` | Allowed frontend domains |
| `GEMINI_API_KEY` | *(Optional)* | Google AI Studio Key for live Gemini AI |

6. Click **"Deploy Web Service"**.
7. Wait 3–4 minutes for the Docker image to build. Once deployed, Flyway will automatically run database migrations and create all tables and initial tickets.
8. Copy your backend public URL:
   `https://virtualcompany-backend.onrender.com`

---

## Step 4: Deploy Frontend on Vercel

1. Log in to [Vercel.com](https://vercel.com/) with your GitHub account.
2. Click **"Add New..."** > **Project**.
3. Import your GitHub repository `virtualcompany`.
4. Configure the Project:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and choose `frontend`.
5. Expand the **Environment Variables** section and add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://virtualcompany-backend.onrender.com/api/v1` *(use your Render URL from Step 3)*
6. Click **Deploy**.
7. Vercel will build and deploy your site in ~45 seconds and give you a public URL (e.g. `https://virtualcompany.vercel.app`).

---

## Step 5: Final Check

1. Open your Vercel URL in your browser: `https://virtualcompany.vercel.app`.
2. Register a new student account or sign in with `arjun@example.com` / `Password123!`.
3. Open the **Sprint Board (Workspace)**, test Kanban ticket movements, and chat with **Alex Mitchell (AI Tech Lead)**.
4. Your application is now live on the public internet with SSL enabled and zero ongoing hosting costs!
