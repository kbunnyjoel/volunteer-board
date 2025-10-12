# Volunteer Board

Quick one-day build plan for a lightweight volunteer opportunity board.

## Project Layout

- `client/` – Vite + React frontend (pulls data from the local API)
- `server/` – Node/Express backend with REST routes and in-memory data store
- `db/` – Supabase schema migrations or seed data
- `planning/` – project-level docs (`project-planning.md`)

## Getting Started

1. Install dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. Copy `.env.example` to `.env` and fill in any Supabase credentials when available.
3. If using Supabase, set up the schema with the statements in `db/schema.sql` (SQL Editor → Run) and configure env vars. Defaults point to a local Supabase CLI instance (`http://127.0.0.1:54321`); replace them with hosted project values when deploying:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only, keep private)
   - `SUPABASE_ANON_KEY` (optional for future client usage)
   - `ADMIN_SECRET` (optional fallback secret for `/admin`)
   - `ADMIN_EMAILS` (comma-separated list of admin emails authorised for `/admin`)
4. Run the local stack:
   ```bash
   # terminal 1
   cd server && npm run dev

   # terminal 2
   cd client && npm run dev
   ```
5. Visit `http://localhost:5173` for the volunteer experience (`/`) or `http://localhost:5173/admin` for the admin dashboard backed by the Express API.

6. Enable admin authentication (Supabase Auth):
   - Copy `client/.env.example` to `client/.env` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and (for production) `VITE_API_BASE_URL` pointing at your backend’s public URL.
   - Create an admin user in Supabase and confirm the email, e.g.
     ```bash
     supabase auth admin create-user --email admin@example.com --password "YourSecurePass123" --email-confirm true
     ```
   - Add the admin email to `ADMIN_EMAILS` in `.env`.

If the backend is stopped the frontend will surface an error card, so keep `npm run dev` running in `server/` during development.

- `/admin` → sign in with a Supabase email/password defined in `ADMIN_EMAILS` to view recent signups and manage opportunities (create, edit, archive). A legacy `ADMIN_SECRET` header is still supported as a fallback.
- Use the **Refresh** button to pull the latest data without reloading the entire app; **Log out** clears the stored token.

Seed local Supabase with sample data:
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f db/schema.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f db/sql/seed-opportunities.sql
```

## Testing

- Backend smoke tests:  
  ```bash
  cd server
  npm run test
  ```
  The suite stubs Supabase responses and validates health, opportunity listing, and admin-guarded signup listing.
- Frontend unit tests:  
  ```bash
  cd client
  npm install   # ensure dev deps are installed
  npm run test
  ```
  For coverage reports:
  ```bash
  npm run test:coverage
  ```
  Covers volunteer signup flow and admin authentication with mocked Supabase + API calls.
- Frontend manual QA: volunteer signup flow and `/admin` dashboard (sign in with a Supabase admin user).

## Kickoff Tasks

1. Finalize the single critical user flow (browse + signup, or post + manage).
2. Scaffold frontend with mocked services, lock in component structure.
3. Stand up Express API matching the agreed contract using in-memory data.
4. Map the schema in Supabase, then swap the backend data layer to Supabase.
5. Smoke-test end-to-end, update README with run instructions, and deploy or package deliverables.

## Tooling Notes

- Supabase free tier for quick database hosting (delete instance after demo).
- Vercel/Railway for lightweight deployments if time permits; otherwise run locally.
- Use environment variables via `.env` (copy from `.env.example`) for secrets.

## Container Deployments

Build and run everything with Docker Compose (expects `.env` to contain Supabase and admin values):

```bash
docker compose up --build
```

- Backend: http://localhost:4000  
- Frontend: http://localhost:5173 (proxies `/api` to backend)

For production, supply hosted Supabase credentials (e.g. via platform env vars) instead of the local defaults.

### Continuous Integration

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on pushes and pull requests:

- installs dependencies for `server/` and `client/`
- executes backend (`npm run test`) and frontend unit suites (`npm run test -- --run`)
- builds Docker images for backend and frontend to ensure container builds stay healthy

If you add the secrets `DOCKER_USERNAME` and `DOCKER_PASSWORD` (and optionally `DOCKER_ORG`) to the repository, the workflow logs in to Docker Hub (`docker.io`) and pushes images tagged with the current commit SHA.
In the absence of credentials it simply builds the images locally for verification.

If you add environment-specific secrets (real Supabase keys, registry credentials), configure them in the repository settings before extending the workflow to push images or deploy.
