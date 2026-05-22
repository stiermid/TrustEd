# TrustEd

A course review platform where reviews are anonymous by default and verified by LinkedIn — so you know every review comes from someone who actually took the course.

Built for Hackathon 2026.

---

## What it does

- **Browse courses** from institutions like Holberton School, Coursera, and Udemy — no account required
- **Filter by category** (Web Development, Machine Learning, Cloud Computing, etc.) or search by name
- **Read reviews** anonymously; if a reviewer is in your network, their name is revealed
- **Enroll to review** — submit a request, an admin verifies your LinkedIn profile, then you can write a review
- **Connect with alumni** — discover and connect with other verified learners from the same course
- **Admin panel** — add/edit/delete courses, verify enrollments, moderate reviews

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite, React Router v7 |
| Backend | Express.js, Node.js |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth — LinkedIn OIDC |
| Deployment | Vercel (frontend) · Render (backend) |

---

## Project structure

```
TrustEd/
├── frontend/               # React SPA
│   ├── src/
│   │   ├── pages/          # HeroPage, CoursesPage, CourseDetailPage,
│   │   │                   # ConnectionsPage, ProfilePage, AdminPage
│   │   ├── components/     # Navbar
│   │   ├── context/        # AuthContext (Supabase session + backend sync)
│   │   └── lib/            # api.js (fetch wrapper), supabase.js
│   └── vercel.json         # SPA rewrite rule
│
└── backend/                # Express REST API
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.js          # Holberton courses
    │   ├── seed-mock.js     # Mock users + reviews
    │   └── seed-schools.js  # Coursera + Udemy courses + reviews
    └── src/
        ├── index.js         # Entry point, all routes at /api/v1
        ├── middleware/      # authenticate, optionalAuthenticate, requireAdmin
        ├── routes/          # auth, users, courses, enrollments, reviews, connections
        └── utils/           # anonymize.js — connection-aware review de-anonymization
```

---

## Local setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with LinkedIn OIDC enabled
- LinkedIn Developer App with the Supabase callback URL registered

### Backend

```bash
cd backend
cp .env.example .env   # fill in your Supabase credentials
npm install
npm run db:generate    # generate Prisma client
npm run db:migrate     # run migrations
npm run dev            # starts on http://localhost:3000
```

**Seed the database** (run in order):

```bash
node prisma/seed.js          # Holberton courses
node prisma/seed-mock.js     # mock users + reviews
node prisma/seed-schools.js  # Coursera + Udemy courses + reviews
```

To promote a user to admin, run this in your Supabase SQL editor or psql:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in Supabase + backend URL
npm install
npm run dev   # starts on http://localhost:5173
```

**.env.local** variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3000
```

---

## How enrollment verification works

1. User adds their LinkedIn profile URL to their profile
2. User clicks **Enroll to Review** on a course page
3. Admin opens the Admin Panel → Verify Enrollments, sees the user's LinkedIn link
4. Admin clicks **Verify** (or Reject)
5. User can now write a review for that course

---

## Anonymity model

Reviews are anonymous to everyone by default. The server resolves authorship based on connections:

- If the reviewer and the viewer are connected → reviewer's name and avatar are shown
- Otherwise → "Anonymous Learner" with a lock icon

This is resolved server-side — the frontend never receives raw user IDs for anonymous reviews.

---

## API overview

All endpoints are prefixed `/api/v1`. Every endpoint except `POST /auth/sync` requires `Authorization: Bearer <JWT>`. Courses and reviews are publicly readable.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/sync` | Create or update user from Supabase session |
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update name / LinkedIn URL |
| GET | `/courses` | List all courses |
| POST | `/courses` | Create course (admin) |
| GET | `/courses/:id` | Get course with rating summary |
| GET | `/courses/:id/reviews` | List reviews (anonymity-aware) |
| POST | `/courses/:id/reviews` | Submit a review (verified enrollment required) |
| POST | `/courses/:id/enroll` | Request enrollment (LinkedIn URL required) |
| GET | `/courses/:id/enrollments` | List enrollments (admin) |
| PATCH | `/enrollments/:id/verify` | Verify or reject enrollment (admin) |
| GET | `/connections` | List accepted connections |
| POST | `/connections` | Send connection request |
| PATCH | `/connections/:id` | Accept or reject request |
| GET | `/discover/courses/:id` | Verified learners on a course (for People tab) |

---

## Team

Built at Hackathon 2026.
