# Animated UI and personal portfolio

Local pages:
- Product: http://localhost:3000
- Student dashboard: http://localhost:3000/dashboard (sign in first)
- Personal portfolio: http://localhost:3000/portfolio
- Backend health: http://localhost:8080/api/v1/health

## Add your photo and links

Edit `frontend/src/lib/portfolio.ts`:

```ts
imageUrl: 'https://your-image-host.com/your-photo.jpg',
githubUrl: 'https://github.com/your-username',
linkedinUrl: 'https://www.linkedin.com/in/your-username/',
email: 'your-email@example.com',
```

Alternatively create `frontend/public`, put `sarthak.jpg` there, and set
`imageUrl: '/sarthak.jpg'`. Empty or broken photos show the SD initials.
Social buttons appear when their values are filled in.

The navbar creator button opens the same portfolio in an accessible dialog.
Escape closes it, focus stays inside while open, and body scrolling is locked.
Animations respect the system reduced-motion setting.

## Start locally on Windows

With your existing PostgreSQL database running on port 5432:

```powershell
cd C:\virtualcompany\backend
mvn "-Dmaven.repo.local=C:/Users/sarth/.m2/repository" spring-boot:run
```

In a second terminal:

```powershell
cd C:\virtualcompany\frontend
npm.cmd run dev
```

If these ports are already running, reuse the existing servers.
To verify a production build without conflicting with the dev server:

```powershell
$env:NEXT_BUILD_DIR='.next-build'
npm.cmd run build
```

Use the same `NEXT_BUILD_DIR` value with `npm.cmd run start` if serving that build.
