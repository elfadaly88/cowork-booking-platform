## Cowork Booking Platform – AI contributor guide

This repo is a full‑stack app with an Angular 19 frontend and an ASP.NET Core API. Use this as your quick start to make correct changes fast and in the project’s style.

### Architecture at a glance
- Frontend: `frontend/cowork-booking` (Angular standalone app)
  - Routing: `src/app/app.routes.ts` (paths: `/`, `/workspace/:id`, `/booking/:roomId`, `/admin`, `/admin-simple`)
  - App providers: `src/app/app.config.ts` uses `provideRouter`, `provideAnimations`, and `provideHttpClient(withInterceptorsFromDi())`.
  - Data access: services under `src/app/core/services/*` use `HttpClient` and `environment.apiBaseUrl`.
  - Types/models: `src/app/core/models/*` define DTO shapes shared across features (e.g., `Workspace`, `Room`, `Device`, `BookingRequest`).
  - Styling: global `src/styles.scss` with Tailwind v4 (via `@tailwindcss/postcss`), Angular Material prebuilt theme, and Leaflet CSS.
- Backend: `BackEnd/` layered into `Api`, `Application`, `Domain`, `Infrastructure`.
  - Web API startup: `CoworkBooking.Api/Program.cs` wires EF Core, CORS for `http(s)://localhost:4200`, Swagger UI at `/`.
  - Controllers: REST endpoints under `/api/*` (e.g., `WorkSpacesController`, `RoomsController`, `DevicesController`, `BookingsController`).
  - Data: EF Core via `Infrastructure/Data/AppDbContext` with SQL Server by default, auto‑fallback to InMemory if unreachable. DB is created/migrated and seeded on startup.

### API surfaces used by the frontend
- Base URL is configured in `src/environments/*`:
  - Development replacement is set in `angular.json`: `environment.ts` → `environment.development.ts`.
  - Default values point to `https://localhost:5001/api`.
- Example calls:
  - Workspaces: `GET /api/workspaces`, `GET /api/workspaces/{id}`, `POST /api/workspaces`, `POST /api/workspaces/with-rooms`, `PUT /api/workspaces/{id}`, `PUT /api/workspaces/{id}/with-rooms`, `DELETE /api/workspaces/{id}`.
  - Bookings: `GET /api/bookings`, `GET /api/bookings/{id}`, `POST /api/bookings`, `PUT /api/bookings/{id}`, `DELETE /api/bookings/{id}`.
  - Rooms/Devices follow the same CRUD pattern.

### Frontend conventions and patterns
- Prefer Angular “standalone” style: routes live in `app.routes.ts`; provide app‑wide services in `app.config.ts`.
- Services use `inject(HttpClient)` and compose URLs from `environment.apiBaseUrl`. Errors are piped through `catchError` and rethrown with a user‑friendly message:
  - See `WorkspaceService.getWorkspaces()` and `BookingService.createBooking()` for the pattern to follow.
- Models define the expected shapes for API payloads and UI state. Use `core/models/*` types when extending services or components (e.g., `Workspace`, `CreateWorkspaceDto`, `BookingRequest`).
- Styling stack: Tailwind utility classes alongside SCSS tokens (CSS variables in `styles.scss`). Use existing variables (e.g., `--primary-blue`) and utility classes instead of ad‑hoc styles.

### Backend conventions and patterns
- Controllers map 1:1 to resource names (plural) under `api/<resource>`; DTOs live in `Application/DTOs` and service abstractions in `Application/Interfaces` / `Domain/Interfaces`.
- Startup (`Program.cs`) registers:
  - EF Core SQL Server via `DefaultConnection`; if not available or `DatabaseSettings:UseInMemory` is true, switches to InMemory.
  - CORS policy "AllowAngularDev" allowing `http://localhost:4200` and `https://localhost:4200`.
  - Swagger UI is enabled in Development and also configured as the homepage.
- Seeding: `SeedData.Initialize(context)` runs on startup after ensuring/migrating the DB.

### Local development workflow
- Frontend (Angular):
  - Start dev server: `npm start` (runs `ng serve`) from `frontend/cowork-booking/`.
  - Unit tests: `npm test` (Karma).
  - Builds: `npm run build` → output to `dist/cowork-booking/`.
  - In VS Code, tasks are available for `start` and `test` in this folder.
- Backend (API):
  - Run API from `BackEnd/CoworkBooking.Api`: `dotnet run` (profiles expose `http://localhost:5000` and `https://localhost:5001`).
  - Swagger UI is served at `/` once running. Ensure HTTPS dev certs are trusted if calling `https://localhost:5001`.

### Adding or changing features
- Frontend → new API call: add a method to an existing service in `core/services`, type it with `core/models/*`, build URL from `environment.apiBaseUrl`, and follow the `catchError` rethrow pattern.
- Backend → new endpoint: add DTOs to `Application/DTOs`, define interface methods in `Application/Interfaces`, implement in `Application/Services` and/or `Domain` where appropriate, then expose via a new action in the corresponding `Api/Controllers/*Controller.cs`.

### Gotchas and integration notes
- CORS allows only the Angular dev origin by default. If your frontend origin differs, update the `AllowAngularDev` policy in `Program.cs`.
- Keep the base URL ending with `/api` to match controller routes. If you change ports, update `src/environments/*` accordingly.
- Leaflet and Angular Material CSS are globally imported in `styles.scss`; avoid duplicate imports in components.

Reference files: `src/app/app.routes.ts`, `src/app/app.config.ts`, `src/app/core/services/*`, `src/app/core/models/*`, `BackEnd/CoworkBooking.Api/Program.cs`, `BackEnd/CoworkBooking.Api/Controllers/*`.
