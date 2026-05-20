# TrustEd — Technical Documentation

> **Version:** 1.0
> **Date:** May 2026
> **Purpose:** API contract & implementation reference for backend (Express/Prisma/Supabase) and frontend integration

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles](#3-user-roles)
4. [Authentication](#4-authentication)
5. [Database Schema (Prisma)](#5-database-schema-prisma)
6. [API Endpoints](#6-api-endpoints)
7. [Business Logic](#7-business-logic)
8. [Error Codes](#8-error-codes)

---

## 1. Project Overview

**TrustEd** is a course review platform where users can rate and review courses they have completed. Reviews are anonymous by default — a user can only see who wrote a review if they have an accepted connection with that person. Users can discover others who took the same course and send connection requests. Admins manage the course catalog and verify user enrollments via LinkedIn.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL (hosted on Supabase) |
| Auth Provider | Supabase Auth (Google OAuth + LinkedIn OAuth) |
| File Storage | Supabase Storage (if needed for avatars) |
| JWT | Handled by Supabase Auth automatically |

### Key Decisions

- **Supabase Auth** handles Google and LinkedIn OAuth flows, session management, and JWT issuance. Express middleware validates the JWT from Supabase on each request.
- **Prisma** connects to the same Supabase PostgreSQL database using the connection string from Supabase dashboard (`DATABASE_URL`).
- **Row Level Security (RLS)** on Supabase can be disabled for tables managed entirely through the Express API, since Prisma + Express handles access control at the application layer.

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-supabase-jwt-secret
PORT=3000
```

---

## 3. User Roles

| Role | Description |
|------|-------------|
| `USER` | Standard registered user |
| `ADMIN` | Can add courses and verify enrollments |

---

## 4. Authentication

### 4.1 Overview

Authentication is handled by **Supabase Auth**. The frontend uses the Supabase JS client to initiate OAuth flows. Upon successful login, Supabase issues a JWT. The frontend attaches this JWT to every API request in the `Authorization` header. Express middleware verifies the token using the Supabase JWT secret.

```
Frontend → Supabase Auth (OAuth) → JWT
Frontend → Express API (JWT in header) → Supabase JWT verification → Route handler
```

### 4.2 Express Auth Middleware

```js
// middleware/auth.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token.' } });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' } });
  }

  // Attach the Prisma user record to request
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) {
    return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User record not found.' } });
  }

  req.user = dbUser;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required.' } });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
```

### 4.3 OAuth Flows

Both Google and LinkedIn OAuth are configured inside the **Supabase Dashboard** (Authentication → Providers). The frontend triggers the flow using the Supabase JS client:

```js
// Frontend (Supabase JS client)
await supabase.auth.signInWithOAuth({ provider: 'google' });
await supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc' });
```

After OAuth completes, Supabase redirects back to the frontend with a session. The frontend then calls `POST /auth/sync` to ensure a corresponding user record exists in the Prisma/Postgres database.

### 4.4 Auth Sync Endpoint

#### `POST /auth/sync`

Called by the frontend immediately after a successful Supabase OAuth login to create or retrieve the user's record in the application database.

**Auth:** Required (Supabase JWT)

**Request Body:** _(empty — user info is read from the JWT)_

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "role": "USER",
  "linkedinConnected": false
}
```

**Implementation note:** On the Express side, check if a `User` row exists with the given `supabaseId`. If not, create one. This is the only place user records are created.

### 4.5 LinkedIn Connection

A user may have registered via Google but later connect their LinkedIn account to enable enrollment verification. The frontend triggers a LinkedIn OAuth flow via Supabase and then calls:

#### `POST /auth/linkedin/connect`

Links the LinkedIn identity to the existing user account.

**Auth:** Required

**Response:**
```json
{
  "linkedinConnected": true,
  "linkedinProfileUrl": "https://linkedin.com/in/username"
}
```

**Implementation note:** Supabase Auth supports multiple identities per user. After linking, store the LinkedIn profile URL in the `User` table via Prisma.

---

## 5. Database Schema (Prisma)

### 5.1 schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Required for Supabase connection pooling
}

enum Role {
  USER
  ADMIN
}

enum EnrollmentStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum ConnectionStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model User {
  id                 String   @id @default(uuid())
  supabaseId         String   @unique  // Supabase Auth user.id
  email              String   @unique
  name               String
  avatarUrl          String?
  role               Role     @default(USER)
  linkedinConnected  Boolean  @default(false)
  linkedinProfileUrl String?
  createdAt          DateTime @default(now())

  reviews            Review[]
  enrollments        Enrollment[]
  sentConnections    Connection[] @relation("Requester")
  receivedConnections Connection[] @relation("Receiver")
  verifiedEnrollments Enrollment[] @relation("VerifiedBy")
}

model Course {
  id          String   @id @default(uuid())
  title       String
  provider    String
  description String?
  url         String?
  createdById String
  createdAt   DateTime @default(now())

  createdBy   User         @relation(fields: [createdById], references: [id])
  reviews     Review[]
  enrollments Enrollment[]
}

model Enrollment {
  id           String           @id @default(uuid())
  userId       String
  courseId     String
  status       EnrollmentStatus @default(PENDING)
  verifiedAt   DateTime?
  verifiedById String?
  createdAt    DateTime         @default(now())

  user         User    @relation(fields: [userId], references: [id])
  course       Course  @relation(fields: [courseId], references: [id])
  verifiedBy   User?   @relation("VerifiedBy", fields: [verifiedById], references: [id])

  @@unique([userId, courseId])
}

model Review {
  id        String   @id @default(uuid())
  userId    String
  courseId  String
  rating    Int      // 1–5
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}

model Connection {
  id          String           @id @default(uuid())
  requesterId String
  receiverId  String
  status      ConnectionStatus @default(PENDING)
  createdAt   DateTime         @default(now())

  requester User @relation("Requester", fields: [requesterId], references: [id])
  receiver  User @relation("Receiver", fields: [receiverId], references: [id])

  @@unique([requesterId, receiverId])
}
```

### 5.2 Supabase Notes

- Run `prisma migrate dev` locally against the Supabase PostgreSQL instance.
- Use `DIRECT_URL` (non-pooled connection string from Supabase) for migrations; use `DATABASE_URL` (pooled) for the running app.
- Do **not** enable Row Level Security on tables managed by Prisma — access control is handled in Express middleware.

---

## 6. API Endpoints

**Base URL:** `/api/v1`

All endpoints except `/auth/sync` require the `Authorization: Bearer <token>` header.

**Standard success envelope** (optional but recommended):
```json
{
  "data": { ... }
}
```

---

### 6.1 Users

#### `GET /users/me`
Returns the current user's profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "role": "USER",
  "linkedinConnected": true,
  "linkedinProfileUrl": "https://linkedin.com/in/johndoe"
}
```

---

#### `PATCH /users/me`
Updates the current user's profile.

**Request Body:**
```json
{
  "name": "New Name"
}
```

**Response:** Updated `User` object.

**Prisma:**
```js
await prisma.user.update({
  where: { id: req.user.id },
  data: { name }
});
```

---

### 6.2 Courses

#### `GET /courses`
Returns a paginated list of all courses.

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Filter by title |
| `provider` | string | — | Filter by provider |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Machine Learning",
      "provider": "Coursera",
      "description": "...",
      "averageRating": 4.3,
      "reviewCount": 12
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

**Prisma:**
```js
const courses = await prisma.course.findMany({
  where: {
    title: search ? { contains: search, mode: 'insensitive' } : undefined,
    provider: provider || undefined,
  },
  skip: (page - 1) * limit,
  take: limit,
  include: { _count: { select: { reviews: true } } }
});
```

Average rating should be computed with `prisma.review.aggregate`.

---

#### `GET /courses/:id`
Returns a single course with details.

**Response:**
```json
{
  "id": "uuid",
  "title": "Machine Learning",
  "provider": "Coursera",
  "description": "...",
  "url": "https://coursera.org/...",
  "averageRating": 4.3,
  "reviewCount": 12,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

#### `POST /courses` *(Admin only)*
Creates a new course.

**Middleware:** `authenticate`, `requireAdmin`

**Request Body:**
```json
{
  "title": "Machine Learning",
  "provider": "Coursera",
  "description": "By Andrew Ng",
  "url": "https://coursera.org/learn/machine-learning"
}
```

**Response:** `201 Created` — created `Course` object.

**Prisma:**
```js
await prisma.course.create({
  data: { title, provider, description, url, createdById: req.user.id }
});
```

---

### 6.3 Enrollments

#### `POST /courses/:courseId/enroll`
Enrolls the current user in a course (status: `PENDING`).

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "courseId": "uuid",
  "userId": "uuid",
  "status": "PENDING"
}
```

**Errors:**
- Course not found → `404`
- Already enrolled → `409`

**Prisma:**
```js
await prisma.enrollment.create({
  data: { userId: req.user.id, courseId, status: 'PENDING' }
});
```

---

#### `GET /courses/:courseId/enrollments` *(Admin only)*
Returns all enrollments for a course (for the admin verification panel).

**Middleware:** `authenticate`, `requireAdmin`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "PENDING",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "linkedinConnected": true,
        "linkedinProfileUrl": "https://linkedin.com/in/johndoe"
      },
      "verifiedAt": null
    }
  ]
}
```

---

#### `PATCH /enrollments/:id/verify` *(Admin only)*
Admin verifies or rejects an enrollment.

**Middleware:** `authenticate`, `requireAdmin`

**Request Body:**
```json
{
  "status": "VERIFIED"
}
```

> Accepted values: `"VERIFIED"` or `"REJECTED"`

**Business rule:** If the target user's `linkedinConnected` is `false`, return `403` — LinkedIn must be connected before verification.

**Response:** Updated `Enrollment` object.

**Prisma:**
```js
const enrollment = await prisma.enrollment.findUnique({
  where: { id },
  include: { user: true }
});

if (!enrollment.user.linkedinConnected) {
  return res.status(403).json({
    error: { code: 'LINKEDIN_NOT_CONNECTED', message: 'User must connect LinkedIn before verification.' }
  });
}

await prisma.enrollment.update({
  where: { id },
  data: {
    status,
    verifiedAt: status === 'VERIFIED' ? new Date() : null,
    verifiedById: req.user.id
  }
});
```

---

### 6.4 Reviews

#### `GET /courses/:courseId/reviews`
Returns all reviews for a course. **Anonymity logic is applied server-side.**

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "content": "Excellent course structure.",
      "createdAt": "2026-03-15T10:00:00.000Z",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "avatarUrl": "https://..."
      }
    },
    {
      "id": "uuid",
      "rating": 3,
      "content": "Average pacing.",
      "createdAt": "2026-03-10T08:00:00.000Z",
      "author": null
    }
  ]
}
```

> `author: null` → anonymous to the current user (no connection exists).
> `author: { ... }` → an accepted connection exists between the current user and the reviewer.

**Implementation note:** See [§7.1](#71-anonymity-logic) for the server-side algorithm.

---

#### `POST /courses/:courseId/reviews`
Submits a review for a course.

**Precondition:** The user must have a `VERIFIED` enrollment for this course.

**Request Body:**
```json
{
  "rating": 4,
  "content": "Very well structured course."
}
```

**Validation:**
- `rating` must be an integer between 1 and 5
- `content` must be a non-empty string

**Response:** `201 Created` — created `Review` object.

**Errors:**
- No verified enrollment → `403 ENROLLMENT_NOT_VERIFIED`
- Review already exists → `409 REVIEW_ALREADY_EXISTS`

**Prisma:**
```js
const enrollment = await prisma.enrollment.findUnique({
  where: { userId_courseId: { userId: req.user.id, courseId } }
});

if (!enrollment || enrollment.status !== 'VERIFIED') {
  return res.status(403).json({ error: { code: 'ENROLLMENT_NOT_VERIFIED' } });
}

await prisma.review.create({
  data: { userId: req.user.id, courseId, rating, content }
});
```

---

#### `PATCH /reviews/:id`
Updates the current user's own review.

**Request Body:**
```json
{
  "rating": 5,
  "content": "Updated review text."
}
```

**Response:** Updated `Review` object.

**Error:** Review not found or does not belong to current user → `403`

---

#### `DELETE /reviews/:id`
Deletes the current user's own review.

**Response:** `204 No Content`

---

### 6.5 Connections

#### `GET /discover/courses/:courseId`
"Discover" feature — returns users who have a **verified enrollment** in the given course, excluding the current user and existing accepted connections.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "avatarUrl": "https://...",
      "connectionStatus": "none"
    },
    {
      "id": "uuid",
      "name": "Bob Johnson",
      "avatarUrl": "https://...",
      "connectionStatus": "pending"
    }
  ]
}
```

> `connectionStatus` values: `"none"` | `"pending"` | `"accepted"`

**Implementation note:** See [§7.2](#72-discover-logic) for filtering details.

---

#### `POST /connections`
Sends a connection request.

**Request Body:**
```json
{
  "receiverId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "requesterId": "uuid",
  "receiverId": "uuid",
  "status": "PENDING"
}
```

**Errors:**
- Sending to self → `400 SELF_CONNECTION`
- Request already exists → `409 CONNECTION_ALREADY_EXISTS`

**Prisma:**
```js
await prisma.connection.create({
  data: { requesterId: req.user.id, receiverId, status: 'PENDING' }
});
```

---

#### `GET /connections`
Returns all accepted connections of the current user.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Jane Smith",
        "avatarUrl": "https://..."
      },
      "connectedSince": "2026-02-10T00:00:00.000Z"
    }
  ]
}
```

**Prisma:**
```js
await prisma.connection.findMany({
  where: {
    status: 'ACCEPTED',
    OR: [{ requesterId: req.user.id }, { receiverId: req.user.id }]
  },
  include: { requester: true, receiver: true }
});
```

---

#### `GET /connections/requests`
Returns incoming pending connection requests.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "requester": {
        "id": "uuid",
        "name": "Bob Johnson",
        "avatarUrl": "https://..."
      },
      "createdAt": "2026-04-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `PATCH /connections/:id`
Accepts or rejects an incoming connection request.

**Precondition:** Current user must be the `receiverId` of the connection.

**Request Body:**
```json
{
  "status": "ACCEPTED"
}
```

> Accepted values: `"ACCEPTED"` or `"REJECTED"`

**Response:** Updated `Connection` object.

**Error:** Connection not found or current user is not the receiver → `403`

---

## 7. Business Logic

### 7.1 Anonymity Logic

Applied inside `GET /courses/:courseId/reviews`. For each review, the Express handler determines whether to expose the author:

```
For each review R in course:
  if R.userId === currentUser.id:
    → expose author  (own review)
  else if Connection where:
       (requesterId == currentUser.id AND receiverId == R.userId)
    OR (receiverId == currentUser.id AND requesterId == R.userId)
    AND status == 'ACCEPTED'
    → expose author
  else:
    → set author = null
```

The frontend **never** computes this — it always receives the final resolved shape from the API.

**Prisma approach:** Fetch all accepted connections of the current user first (a single query), build a `Set` of connected user IDs, then map over reviews.

```js
const connections = await prisma.connection.findMany({
  where: {
    status: 'ACCEPTED',
    OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }]
  }
});

const connectedIds = new Set(
  connections.map(c =>
    c.requesterId === currentUserId ? c.receiverId : c.requesterId
  )
);

const mapped = reviews.map(review => ({
  ...review,
  author: review.userId === currentUserId || connectedIds.has(review.userId)
    ? review.user
    : null,
  user: undefined // remove raw field
}));
```

---

### 7.2 Discover Logic

Applied inside `GET /discover/courses/:courseId`.

Returns users where:
1. They have an `Enrollment` with `courseId = :courseId` and `status = 'VERIFIED'`
2. They are **not** the current user
3. There is **no** existing `Connection` between them and the current user with `status = 'ACCEPTED'`

Users with a `PENDING` connection are still returned, but with `connectionStatus: "pending"`.

```js
const verifiedUserIds = (await prisma.enrollment.findMany({
  where: { courseId, status: 'VERIFIED', NOT: { userId: currentUserId } },
  select: { userId: true }
})).map(e => e.userId);

const existingConnections = await prisma.connection.findMany({
  where: {
    OR: [{ requesterId: currentUserId }, { receiverId: currentUserId }],
    OR: [{ requesterId: { in: verifiedUserIds } }, { receiverId: { in: verifiedUserIds } }]
  }
});

// Map connection statuses, exclude ACCEPTED
```

---

### 7.3 Enrollment Verification Flow

```
1. User connects LinkedIn  →  linkedinConnected = true, linkedinProfileUrl saved
2. User enrolls in course  →  Enrollment(status: PENDING)
3. Admin views enrollments for course (GET /courses/:courseId/enrollments)
4. Admin manually checks user's LinkedIn profile URL to confirm course completion
5. Admin calls PATCH /enrollments/:id/verify { status: "VERIFIED" }
6. User can now write a review for this course
```

> Automated LinkedIn API verification is **out of scope** for this version. The admin manually cross-references the LinkedIn profile.

---

### 7.4 Review Eligibility

A user may submit a review if and only if:
1. An `Enrollment` record exists for `(userId, courseId)`
2. The enrollment `status` is `VERIFIED`
3. No existing `Review` exists for `(userId, courseId)` — one review per course per user

---

## 8. Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| `400` | `BAD_REQUEST` | Malformed input |
| `400` | `SELF_CONNECTION` | User tried to connect to themselves |
| `401` | `UNAUTHORIZED` | Missing or invalid JWT |
| `403` | `FORBIDDEN` | Insufficient permissions |
| `403` | `ENROLLMENT_NOT_VERIFIED` | Review attempt without verified enrollment |
| `403` | `LINKEDIN_NOT_CONNECTED` | Verification attempted without LinkedIn |
| `404` | `NOT_FOUND` | Resource does not exist |
| `409` | `REVIEW_ALREADY_EXISTS` | Duplicate review for same course |
| `409` | `CONNECTION_ALREADY_EXISTS` | Duplicate connection request |
| `422` | `VALIDATION_ERROR` | Field-level validation failure |
| `500` | `INTERNAL_ERROR` | Unexpected server error |

**Standard error response shape:**
```json
{
  "error": {
    "code": "ENROLLMENT_NOT_VERIFIED",
    "message": "You must have a verified enrollment to write a review."
  }
}
```

---

*TrustEd — Hackathon 2026*
