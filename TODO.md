# 📝 Cowork Booking Platform — To-Do List

## ✅ Phase 1 — Critical Fixes (COMPLETED)

### Backend
- [x] Add `Status` field to `Booking` entity (`Confirmed`, `Cancelled`, `Pending`, `Completed`)
- [x] Add `GET /api/bookings/my-bookings` endpoint (user's own bookings)
- [x] Add booking conflict check in `BookingService.CreateAsync`
- [x] Add `PATCH /api/bookings/{id}/cancel` endpoint
- [x] Add `Images` collection to `WorkSpace` + `WorkspaceImage` entity
- [x] Add `POST /api/workspaces/{id}/images` endpoint for image uploads
- [x] Add `AverageRating` / `TotalReviews` to `WorkSpace` entity
- [x] Add Reviews endpoints: GET/POST/DELETE `/api/workspaces/{id}/reviews`
- [x] Add `PUT /api/auth/profile` (update profile name, email, phone)
- [x] Add `POST /api/auth/change-password` endpoint
- [x] Add `EmailService` (booking confirmation + cancellation emails)
- [x] Fix `BookingStatus` enum serialized as string in JSON responses
- [x] Fix `GetByIdAsync` + `GetAvailableWorkspacesAsync` to include Images, AverageRating, TotalReviews

### Frontend
- [x] Public Landing page at `/` (marketing, no auth required)
- [x] Move auth-guarded workspace browse to `/workspaces`
- [x] Add search/filter bar on workspaces list (city, price, capacity, sort)
- [x] Add workspace images to cards (mainImageUrl from API)
- [x] Add rating badge to workspace cards
- [x] Add `My Bookings` page (`/my-bookings`) with status tabs + cancel booking
- [x] Add `Profile` page (`/profile`) — update name/email/phone + change password
- [x] Add navbar with user info on all pages (via `AppComponent`)
- [x] Add reviews section on workspace details (list + submit + edit + delete)
- [x] Add image gallery carousel on workspace details
- [x] Fix "Back to Workspaces" link in My Bookings

## ✅ Phase 2 — PWA Ready (COMPLETED)
- [x] `manifest.webmanifest` configured (icons, theme, display: standalone)
- [x] PWA shortcuts configured for Browse + My Bookings

## 🔲 Phase 3 — Business Features (REMAINING)
- [ ] Payment integration (Stripe or Paymob mock → real)
- [ ] Owner analytics dashboard (revenue, occupancy charts using Chart.js)
- [ ] Map integration (show all workspaces on Leaflet map, "Near Me" search)

## 🔲 Phase 4 — Scale (REMAINING)
- [ ] SSO (Google OAuth)
- [ ] Admin audit logs
- [ ] Bulk actions in admin
- [ ] Reporting & export (PDF invoices)
- [ ] Flutter mobile app (reusing the same API)
- [ ] CI/CD pipeline (GitHub Actions → Azure / Render)
- [ ] Rate limiting & API security hardening
- [ ] Replace InMemory DB with persistent SQL Server for production
