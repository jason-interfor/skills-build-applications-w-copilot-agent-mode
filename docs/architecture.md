# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app thin and route-driven, with each page composing a shared `CapabilityCard` that renders real API data, loading badges, empty states, and accessible alerts without embedding business logic in components.
- Logic tier decision: Keep Express routes as adapters around a single backend service layer, with validation and error normalization handled in the service and app-level error middleware so request handling stays consistent and 4xx/5xx responses remain deliberate.
- Data tier decision: Use Mongoose schemas as the contract boundary, enforce required fields and refs with validation, and keep seeding idempotent with upsert behavior so demo data is reproducible without deleting app-owned records.
- Activity tracking approach: Store `user`, `team`, `type`, `minutes`, `points`, and `occurredAt`; compute `points` from minutes and timestamp metadata, and reject malformed IDs or missing references with 4xx responses rather than leaking Mongo cast errors as 500s.
- Team management approach: Require `name` and `mascot`, default `members` to an empty array, and keep membership in sync with seeded users so each team can expose a member list without orphaned references.
- Leaderboard approach: Aggregate team totals from activity points, sort descending by total, and assign ranks starting from 1 so the API exposes consistent leaderboard ordering.
- Workout suggestions approach: Match each request to a seeded user by email, infer the recommendation from that user’s goal or recent activity pattern, select workouts whose `focus` matches, and include a human-readable `reason` while returning a deliberate 4xx for unknown users.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`  
  Current failure meaning: schema validation is incomplete; required `Team`, `Activity`, and `Workout` fields are missing, which blocks the seeded data contract before any API logic runs.
- API command: `npm run test:api --prefix octofit-tracker/backend`  
  Current failure meaning: the service layer is still stubbed; invalid team creation returns 501, leaderboard is empty, and workout suggestions do not yet implement user-specific matching or reasons.
- Frontend command: `npm test --prefix octofit-tracker/frontend`  
  Current failure meaning: the UI is still placeholder-only and does not yet render real data, loading/empty/error states, or accessible alerts for each capability.
- Backend build command: `npm run build --prefix octofit-tracker/backend`  
  Run after the schema and service behavior are green to confirm the TypeScript API compiles cleanly and the routes still type-check.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`  
  Run after the API contracts are stable to ensure each route and fetch path compiles and the React app builds without TypeScript or Vite issues.
