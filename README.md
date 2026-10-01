# Virtual Company Platform — Phase 1: Product Foundation

An AI-powered software simulation platform for college students to gain authentic software engineering experience before their first tech job.

---

## 1. Tech Stack Overview

### Backend
- **Java**: OpenJDK 21 (LTS)
- **Framework**: Spring Boot 3.3.4 (Modular Monolith)
- **Database**: PostgreSQL 16 (via Docker container on port `5433:5432`)
- **Persistence**: Spring Data JPA & Hibernate
- **Migrations**: Flyway (`V1__init_schema.sql`, `V2__seed_initial_data.sql`)
- **Security**: Spring Security 6, JWT Authentication (JJWT 0.12.6), BCrypt hashing
- **Validation**: Jakarta Bean Validation (`spring-boot-starter-validation`)
- **Documentation**: Swagger OpenAPI 3.0 (`springdoc-openapi-starter-webmvc-ui:2.6.0`)
- **Utilities**: Project Lombok

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS with custom developer dark mode design system
- **Icons**: Lucide React
- **State & Storage**: React Context + LocalStorage JWT token management

---

## 2. Directory Structure

```
c:\virtualcompany\
├── docker-compose.yml              # PostgreSQL 16 container definition
├── .env.example                     # Environment template
├── README.md                        # Documentation and runbook
│
├── backend/                         # Spring Boot Modular Monolith
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/virtualcompany/
│       │   │   ├── VirtualCompanyApplication.java
│       │   │   ├── common/
│       │   │   │   ├── config/ (SecurityConfig, CorsConfig, OpenApiConfig, Auditing)
│       │   │   │   ├── dto/ (ApiResponse, ErrorResponse)
│       │   │   │   ├── exception/ (GlobalExceptionHandler, ResourceNotFound, etc.)
│       │   │   │   └── security/ (JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal)
│       │   │   └── modules/
│       │   │       ├── auth/ (AuthController, AuthService, Register/Login DTOs)
│       │   │       ├── user/ (User entity, Role, UserRepository)
│       │   │       ├── profile/ (StudentProfile entity, ProfileController, Service)
│       │   │       ├── careertrack/ (CareerTrack entity, CareerTrackController, Admin)
│       │   │       ├── company/ (VirtualCompany entity, CompanyController, Admin)
│       │   │       ├── project/ (Project, ProjectTechnology, ProjectController, Admin)
│       │   │       └── enrollment/ (StudentProjectEnrollment, EnrollmentController, Service)
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       └── db/migration/
│       │           ├── V1__init_schema.sql
│       │           └── V2__seed_initial_data.sql
│
└── frontend/                        # Next.js App Router Application
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                     # Landing page
        │   ├── login/page.tsx               # Login page
        │   ├── register/page.tsx            # Register page
        │   ├── dashboard/page.tsx           # Student command center
        │   ├── profile/page.tsx             # Student profile editor
        │   ├── career-tracks/page.tsx       # Career tracks catalog
        │   ├── career-tracks/[slug]/page.tsx
        │   ├── companies/page.tsx           # Virtual companies catalog
        │   ├── companies/[slug]/page.tsx    # Company details & culture
        │   ├── projects/page.tsx            # Projects catalog
        │   └── projects/[slug]/page.tsx     # Project details & Enroll CTA
        ├── components/
        │   ├── auth/AuthGuard.tsx
        │   ├── layout/ (Navbar, Footer)
        │   └── ui/ (Button, Badge, DifficultyBadge, StatusBadge)
        └── lib/
            ├── api/client.ts
            ├── auth/AuthContext.tsx
            └── types/index.ts
```

---

## 3. Quick Start Instructions

### Prerequisites
- Java 21 (verify with `java -version`)
- Maven 3.9+ (verify with `mvn -version`)
- Node.js 18+ and npm (verify with `node -v` and `npm -v`)
- Docker Desktop (verify with `docker -v`)

### Step 1: Start PostgreSQL
```bash
docker compose up -d
```
*Note: Exposes port `5433:5432` to avoid conflicts with any pre-existing local Postgres instances.*

### Step 2: Start Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
- Server starts on: `http://localhost:8080`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI Specification: `http://localhost:8080/v3/api-docs`
- Flyway automatically applies `V1__init_schema.sql` and `V2__seed_initial_data.sql`.

### Step 3: Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:3000` in your browser.

---

## 4. End-to-End User Flow

1. **Landing Page (`http://localhost:3000`)**
   - View Hero, How It Works, Java Backend Developer track spotlight, and QuickKart virtual company feature.
2. **Registration (`/register`)**
   - Input Name, Email, Password (at least 6 characters).
   - Generates user, hashes password with BCrypt, initializes student profile, issues JWT.
3. **Login (`/login`)**
   - Authenticates against Spring Security, sets JWT in localStorage.
4. **Student Profile (`/profile`)**
   - Update College Name, Graduation Year, Current Year, Experience Level, Bio, GitHub/LinkedIn URLs, and select **Java Backend Developer** career track.
5. **Explore Company (`/companies/quickkart`)**
   - View QuickKart company details, engineering culture, and available projects.
6. **Project Details (`/projects/quickkart-commerce-backend`)**
   - View project overview, technologies (Java 21, Spring Boot, PostgreSQL, REST API, Git, Maven), and difficulty badge.
7. **Enroll / Start Project**
   - Click **"Start / Enroll in Project"**.
8. **Student Dashboard (`/dashboard`)**
   - Shows welcome greeting, profile completion meter, selected career track, and **Current Project**:
     - **Company**: QuickKart
     - **Project**: QuickKart Commerce Backend
     - **Status**: `IN_PROGRESS` (with pulsing amber badge)
     - **Technologies**: Java 21, Spring Boot, PostgreSQL, REST API, Git, Maven
     - **Action**: Continue Project.

---

## 5. API Reference

### Public Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register student + create profile |
| `POST` | `/api/v1/auth/login` | Authenticate + return JWT |
| `GET` | `/api/v1/career-tracks` | List all active career tracks |
| `GET` | `/api/v1/career-tracks/{slug}` | Get career track details by slug |
| `GET` | `/api/v1/companies` | List all active virtual companies |
| `GET` | `/api/v1/companies/{slug}` | Get virtual company details + projects |
| `GET` | `/api/v1/projects` | List projects (optional `?companyId=&trackId=`) |
| `GET` | `/api/v1/projects/{slug}` | Get project details by slug |

### Protected Student Endpoints (Bearer JWT Required)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/auth/me` | Current session information |
| `GET` | `/api/v1/profile` | Get current student profile |
| `PUT` | `/api/v1/profile` | Update current student profile |
| `POST` | `/api/v1/enrollments` | Enroll into a project (sets to `IN_PROGRESS`) |
| `GET` | `/api/v1/enrollments/current` | Get active enrolled project |
| `GET` | `/api/v1/enrollments` | Get student enrollment history |

### Admin Endpoints (Requires `ROLE_ADMIN`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/admin/career-tracks` | Create career track |
| `PUT` | `/api/v1/admin/career-tracks/{id}` | Update career track |
| `DELETE` | `/api/v1/admin/career-tracks/{id}` | Delete career track |
| `POST` | `/api/v1/admin/companies` | Create virtual company |
| `PUT` | `/api/v1/admin/companies/{id}` | Update virtual company |
| `DELETE` | `/api/v1/admin/companies/{id}` | Delete virtual company |
| `POST` | `/api/v1/admin/projects` | Create project |
| `PUT` | `/api/v1/admin/projects/{id}` | Update project |
| `DELETE` | `/api/v1/admin/projects/{id}` | Delete project |
