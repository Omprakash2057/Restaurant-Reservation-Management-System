# Restaurant Reservation Management System

A full-stack reservation system built with React (frontend), Node.js/Express (backend),
and MongoDB (database), using JWT for authentication and role-based access control.

## Tech Stack

- **Frontend:** React 18 + Vite, React Router, Axios
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JSON Web Tokens (JWT), bcrypt for password hashing

## Project Structure

```
restaurant-reservation-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── models/                # User, Table, Reservation schemas
│   │   ├── middleware/            # auth (JWT + role guard), error handler
│   │   ├── controllers/           # business logic
│   │   ├── routes/                # Express route definitions
│   │   ├── seed.js                # seeds demo tables + users
│   │   ├── app.js                 # Express app setup
│   │   └── server.js              # entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js           # axios instance with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/            # Navbar, ProtectedRoute
    │   ├── pages/                 # Home, Login, Register, Reservations, AdminDashboard
    │   ├── App.jsx / main.jsx
    │   └── index.css
    ├── .env.example
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local MongoDB or MongoDB Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set MONGO_URI to your own database connection string,
# and set a strong random JWT_SECRET.
npm install
npm run seed     # creates 6 demo tables + 1 admin + 1 demo customer account
npm run dev       # starts on http://localhost:5000
```

Demo accounts created by the seed script:
| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@restaurant.com   | admin123    |
| Customer | customer@example.com   | customer123 |

> Change or remove these before deploying to a public environment.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env if your backend isn't running on http://localhost:5000/api
npm install
npm run dev       # starts on http://localhost:5173
```

### 3. Production build (frontend)

```bash
npm run build      # outputs static files to frontend/dist
```

## Assumptions Made

- A single restaurant with a fixed set of tables (seeded via `npm run seed`, but also
  manageable through the admin UI: create, edit capacity, activate/deactivate).
- Time slots are a fixed, predefined list (`11:00-12:30`, `12:30-14:00`, `14:00-15:30`,
  `18:00-19:30`, `19:30-21:00`, `21:00-22:30`) rather than free-form times. This keeps
  overlap detection simple and reliable, per the assignment's focus on correctness.
- Public registration always creates a `customer` account. Admin accounts are provisioned
  via the seed script (or directly in the database) rather than through public sign-up,
  to avoid privilege escalation through the registration form.
- Reservation `date` is stored as a `YYYY-MM-DD` string (not a JS `Date`) to avoid
  timezone-shift bugs when comparing dates across the stack.
- Cancelling a reservation is a soft action (`status: 'cancelled'`) rather than deleting
  the record, preserving history for the admin view.
- Deactivating a table is likewise a soft delete (`isActive: false`) so historical
  reservations still reference a valid table document.

## Reservation & Availability Logic

1. When a customer picks a date, time slot, and guest count, the frontend calls
   `GET /api/tables/availability` which:
   - Filters active tables whose `capacity >= guests`.
   - Excludes any table that already has a **confirmed** reservation for that exact
     `date` + `timeSlot`.
2. On submit, `POST /api/reservations` re-validates everything server-side (never trusts
   the client):
   - Table exists and is active.
   - Table capacity is sufficient for the guest count.
   - Date is not in the past.
   - No existing **confirmed** reservation exists for the same table/date/timeSlot
     (a race-condition-safe conflict check run at write time, not just at read time).
3. If a conflict is found, the API returns `409 Conflict` with a clear message instead of
   creating a double booking.
4. Cancelling a reservation sets `status: 'cancelled'`, which immediately frees that
   table/date/timeSlot combination for new bookings.
5. Admin edits (`PUT /api/admin/reservations/:id`) run the same capacity and conflict
   checks before saving changes to date, time slot, table, or guest count.

## Role-Based Access Control

- Every protected route requires a valid JWT (`Authorization: Bearer <token>`), verified
  by the `protect` middleware, which loads the user onto `req.user`.
- The `authorize(...roles)` middleware restricts specific routes to specific roles.
- **Customer** routes (`/api/reservations/*`) let a user create, view, and cancel only
  their **own** reservations — enforced by comparing `reservation.user` to `req.user._id`
  in the controller, not just by hiding UI elements.
- **Admin** routes (`/api/admin/*`) are all gated behind `authorize('admin')` and provide
  full visibility/control: view all reservations (with date/status filters), edit or
  cancel any reservation, and manage tables (create, update, deactivate).
- The frontend also gates routes via `ProtectedRoute`, redirecting unauthenticated users
  to `/login` and non-admins away from `/admin` — this is a UX convenience only; the real
  enforcement happens on the backend.

## Known Limitations

- No password reset / email verification flow.
- No pagination on the admin reservations list (fine for the assignment's scale, would
  need it for a high-volume real restaurant).
- Time slots are a fixed list rather than fully configurable start/end times.
- No real-time updates (e.g. via WebSockets) — the availability check is a snapshot at
  the time of the request, though the server-side conflict check at creation time still
  prevents double-booking races.
- No automated test suite included given the 48-hour scope.

## Areas for Improvement With Additional Time

- Add integration/unit tests (e.g. Jest + Supertest for the API, React Testing Library
  for the frontend).
- Configurable restaurant operating hours and dynamic time-slot generation.
- Pagination and search/filtering (by customer, table) on the admin dashboard.
- Rate limiting and stronger input sanitization on public-facing endpoints.
- Optional email/SMS confirmation on booking and cancellation.
- Multi-restaurant support if the system needed to scale beyond a single location.

## Deployment Notes

- **Backend:** Deploy to Render/Railway (or similar). Set `MONGO_URI`, `JWT_SECRET`,
  `JWT_EXPIRES_IN`, and `CLIENT_ORIGIN` (your deployed frontend URL) as environment
  variables in the platform's dashboard — never commit `.env`.
- **Frontend:** Deploy to Vercel/Netlify. Set `VITE_API_BASE_URL` to your deployed
  backend's `/api` URL as a build-time environment variable.
- **Database:** Use MongoDB Atlas for a free-tier hosted cluster; whitelist your
  backend host's IP (or `0.0.0.0/0` for simplicity during review) and use the
  connection string it provides as `MONGO_URI`.
