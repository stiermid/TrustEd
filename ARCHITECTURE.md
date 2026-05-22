# TrustEd — Architecture

> **Version:** 1.0
> **Date:** May 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Diagram](#2-component-diagram)
3. [Tech Stack & Rationale](#3-tech-stack--rationale)
4. [Authentication Architecture](#4-authentication-architecture)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Database Architecture](#6-database-architecture)
7. [Anonymity System Design](#7-anonymity-system-design)
8. [Folder Structure](#8-folder-structure)

---

## 1. System Overview

TrustEd is a full-stack web application with a clear separation between three layers:

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│              (React / Next.js)                   │
│         Supabase JS Client for Auth              │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────┐
│                 Backend API                      │
│              (Express.js / Node)                 │
│         REST API · Business Logic · Auth         │
└────────────┬─────────────────────┬──────────────┘
             │ Prisma ORM          │ Supabase SDK
┌────────────▼──────────┐ ┌───────▼──────────────┐
│  PostgreSQL Database  │ │   Supabase Auth       │
│  (Supabase hosted)    │ │   (OAuth Provider)    │
└───────────────────────┘ └──────────────────────┘
```

The frontend **never** talks directly to the database. All business logic, access control, and anonymity resolution lives in the Express backend.

---

## 2. Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          Frontend                                 │
│                                                                   │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ Auth Pages │  │ Course List │  │ Course Detail            │  │
│  │ (OAuth     │  │ & Search    │  │ - Reviews (anon-aware)   │  │
│  │  redirect) │  │             │  │ - Write Review           │  │
│  └────────────┘  └─────────────┘  └──────────────────────────┘  │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Discover People │  │ Connections                          │  │
│  │ (per course)    │  │ - Incoming requests                  │  │
│  │                 │  │ - Accepted connections               │  │
│  └─────────────────┘  └──────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Admin Panel                            │   │
│  │  - Add Course   - View Enrollments   - Verify/Reject     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                          │ REST API (JSON)
                          │ Authorization: Bearer <JWT>
┌─────────────────────────▼────────────────────────────────────────┐
│                       Express Backend                             │
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │ Auth Router  │  │ Course Router │  │ Review Router         │ │
│  │ /auth/*      │  │ /courses/*    │  │ /reviews/*            │ │
│  └──────────────┘  └───────────────┘  └───────────────────────┘ │
│                                                                   │
│  ┌──────────────┐  ┌───────────────────────────────────────────┐ │
│  │ Connection   │  │ Middleware                                 │ │
│  │ Router       │  │ - authenticate (JWT verify via Supabase)  │ │
│  │ /connections │  │ - requireAdmin (role check)               │ │
│  │ /discover    │  │ - validate (request body validation)      │ │
│  └──────────────┘  └───────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Prisma Client                            │ │
│  │              (single shared instance)                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │   Supabase PostgreSQL        │
              │                             │
              │  Users · Courses            │
              │  Enrollments · Reviews      │
              │  Connections                │
              └─────────────────────────────┘
```

---

## 3. Tech Stack & Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React / Next.js | Component-based UI, SSR option |
| Auth | Supabase Auth | Built-in OAuth (Google + LinkedIn), JWT management, no custom auth server needed |
| Backend | Express.js (Node) | Lightweight, full control over business logic and middleware |
| ORM | Prisma | Type-safe queries, clean schema definition, easy migrations against Postgres |
| Database | PostgreSQL via Supabase | Reliable relational DB; Supabase hosts it with no extra infrastructure setup |

### Why not use Supabase directly from the frontend?

Supabase supports direct DB access from the frontend via Row Level Security (RLS). We deliberately **avoid this pattern** because:

1. **Anonymity logic is complex** — determining whether a review author should be revealed requires joining connection data. This is safer and cleaner in Express than in RLS policies.
2. **Admin verification logic** — multi-step checks (LinkedIn connected? enrollment exists?) are easier to reason about in application code.
3. **Single source of truth** — all business rules live in one place (Express), not split between RLS policies and frontend code.

---

## 4. Authentication Architecture

### Flow: Initial Login

```
User clicks "Login with Google/LinkedIn"
        │
        ▼
Supabase Auth (OAuth Provider)
  - Handles consent screen
  - Exchanges OAuth code for tokens
  - Issues Supabase JWT
        │
        ▼
Frontend receives session (JWT + refresh token)
        │
        ▼
Frontend calls POST /auth/sync  (with JWT)
        │
        ▼
Express verifies JWT via Supabase SDK
  - Extracts supabaseId from token
  - Creates User row in DB if first login (via Prisma)
  - Returns application user profile
        │
        ▼
Frontend stores session, user is logged in
```

### Flow: Authenticated API Request

```
Frontend
  │  sets Authorization: Bearer <JWT>
  ▼
Express `authenticate` middleware
  │  calls supabase.auth.getUser(token)
  │  fetches User from DB via Prisma (by supabaseId)
  │  attaches req.user
  ▼
Route handler executes with req.user available
```

### Flow: LinkedIn Connection (existing user)

```
User (already logged in with Google) clicks "Connect LinkedIn"
        │
        ▼
Supabase Auth links LinkedIn identity to existing account
        │
        ▼
Frontend calls POST /auth/linkedin/connect  (with JWT)
        │
        ▼
Express updates User row:
  linkedinConnected = true
  linkedinProfileUrl = <from LinkedIn profile>
        │
        ▼
User is now eligible for admin enrollment verification
```

---

## 5. Data Flow Diagrams

### Writing a Review

```
User submits review form
        │
        ▼
POST /courses/:courseId/reviews
        │
        ▼
authenticate middleware
  → verify JWT, attach req.user
        │
        ▼
Check Enrollment:
  prisma.enrollment.findUnique({ userId, courseId })
  └── not found or status ≠ VERIFIED → 403
        │
        ▼
Check duplicate:
  prisma.review.findUnique({ userId, courseId })
  └── exists → 409
        │
        ▼
prisma.review.create(...)
        │
        ▼
201 Created → Review object
```

---

### Fetching Reviews (with Anonymity Resolution)

```
GET /courses/:courseId/reviews
        │
        ▼
authenticate middleware
        │
        ▼
Fetch all reviews for course (with user data)
        │
        ▼
Fetch all ACCEPTED connections of current user
  → build Set<connectedUserId>
        │
        ▼
For each review:
  ├── review.userId === currentUser.id  → expose author
  ├── connectedIds.has(review.userId)   → expose author
  └── otherwise                         → author = null
        │
        ▼
Return mapped array to frontend
```

---

### Admin Enrollment Verification

```
Admin opens enrollment list for a course
        │
        ▼
GET /courses/:courseId/enrollments
  → returns users with linkedinProfileUrl
        │
        ▼
Admin manually opens LinkedIn profile in browser
Admin confirms the user completed the course
        │
        ▼
PATCH /enrollments/:id/verify { status: "VERIFIED" }
        │
        ▼
authenticate + requireAdmin middleware
        │
        ▼
Check user.linkedinConnected === true
  └── false → 403 LINKEDIN_NOT_CONNECTED
        │
        ▼
prisma.enrollment.update({ status: VERIFIED, verifiedAt, verifiedById })
        │
        ▼
User can now write a review for this course
```

---

## 6. Database Architecture

### Entity Relationship Diagram

```
┌──────────────────────┐         ┌───────────────────────┐
│         User         │         │        Course         │
│──────────────────────│         │───────────────────────│
│ id (PK)              │         │ id (PK)               │
│ supabaseId (unique)  │         │ title                 │
│ email (unique)       │         │ provider              │
│ name                 │         │ description           │
│ avatarUrl            │         │ url                   │
│ role                 │         │ createdById (FK)──────┼──┐
│ linkedinConnected    │         │ createdAt             │  │
│ linkedinProfileUrl   │         └──────────┬────────────┘  │
│ createdAt            │                    │               │
└──────┬───────────────┘                    │               │
       │                                    │               │
       │ 1                                  │               │
       │                         ┌──────────┘               │
       ├──────────────┐          │                          │
       │              │ N        │ N                        │ N
       │         ┌────▼──────────▼──┐                      │
       │         │    Enrollment    │                       │
       │         │──────────────────│                       │
       │         │ id (PK)          │                       │
       │         │ userId (FK)      │                       │
       │         │ courseId (FK)    │                       │
       │         │ status           │                       │
       │         │ verifiedAt       │                       │
       │         │ verifiedById(FK)─┼───────────────────────┘
       │         │ createdAt        │
       │         └──────────────────┘
       │
       ├──────────────┐
       │              │ N
       │         ┌────▼─────────────┐
       │         │      Review      │
       │         │──────────────────│
       │         │ id (PK)          │
       │         │ userId (FK)      │
       │         │ courseId (FK)    │
       │         │ rating (1–5)     │
       │         │ content          │
       │         │ createdAt        │
       │         │ updatedAt        │
       │         └──────────────────┘
       │
       └──────────────┐
              N        │ N
         ┌─────────────▼────────────┐
         │        Connection        │
         │──────────────────────────│
         │ id (PK)                  │
         │ requesterId (FK → User)  │
         │ receiverId  (FK → User)  │
         │ status                   │
         │ createdAt                │
         └──────────────────────────┘
```

### Key Constraints

| Constraint | Table | Detail |
|-----------|-------|--------|
| One enrollment per user per course | `Enrollment` | `@@unique([userId, courseId])` |
| One review per user per course | `Review` | `@@unique([userId, courseId])` |
| One connection per pair | `Connection` | `@@unique([requesterId, receiverId])` |
| Supabase ID is unique | `User` | `@unique` on `supabaseId` |

---

## 7. Anonymity System Design

The anonymity system is a core feature of TrustEd. The design principle is:

> **The backend is the single authority on what is visible. The frontend renders what it receives — it never decides anonymity.**

### States

```
Review Author Visibility
        │
        ├── Always visible:   own review (userId === currentUser.id)
        │
        ├── Visible:          accepted connection exists between
        │                     currentUser and review author
        │
        └── Hidden (null):    all other cases
```

### Why server-side?

Doing this on the frontend would require sending all user IDs to the client, which would break anonymity — a determined user could inspect the network response and reveal authors. By resolving it server-side and returning `author: null`, no identifying information is ever transmitted.

---

## 8. Folder Structure

Recommended Express backend structure:

```
backend/
├── prisma/
│   ├── schema.prisma         # Data models
│   └── migrations/           # Migration history
│
├── src/
│   ├── index.js              # App entry point, Express setup
│   ├── lib/
│   │   ├── prisma.js         # Prisma client singleton
│   │   └── supabase.js       # Supabase client singleton
│   │
│   ├── middleware/
│   │   ├── authenticate.js   # JWT verification via Supabase
│   │   ├── requireAdmin.js   # Role-based access control
│   │   └── validate.js       # Request body validation
│   │
│   ├── routes/
│   │   ├── auth.js           # /auth/sync, /auth/linkedin/connect
│   │   ├── users.js          # /users/me
│   │   ├── courses.js        # /courses
│   │   ├── enrollments.js    # /enrollments
│   │   ├── reviews.js        # /reviews
│   │   └── connections.js    # /connections, /discover
│   │
│   └── utils/
│       └── anonymize.js      # Anonymity resolution logic
│
├── .env
├── package.json
└── TECHNICAL_SPEC.md
```

---

*TrustEd — Hackathon 2026*
