# Getting Started

Please install the following packages before working on this application.
neup.core -> https://github.com/neupgroup/neup.core -> then rename "neup.core" to "core"
neup.logica -> https://github.com/neupgroup/neup.logica -> then rename "neup.logica" to "logica"

- Core is a system wide (non application specific code that contains helpers database functions, helper functions and abstraction layers to work on the database.)

- Logica is a SDK to access the data from the account management system and other applications of the neup ecosystem. Logica will later contain API and GRPC abstractions to connection to this application as well.

# 🚀 Next.js TypeScript Blog Engine & Translation Portal

A dynamic, fully featured blog application built inside the `src` directory as a core internship project. The application features dynamic routing, a persistent database layer powered by Prisma ORM, interactive engagement widgets, translations via multi-vendor API fallbacks, and server-side authenticated route controls.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js (_App Router Architecture_)
- **Language:** TypeScript (_Strict Type Compliance_)
- **Database & ORM:** Prisma ORM with PostgreSQL (_Replaced mock DB_)
- **State & Auth:** Custom Authentication Service (`bridge-auth.service.ts`) using Email credentials
- **Line Ending Normalization:** Enforced cross-platform consistency via `.gitattributes` (`eol=lf`)

---

## 🏠 Homepage Features

- **Clean Developer Theme:** High-contrast dark mode optimized for readability.
- **Server-Side Auth & Access Control:** Checks for `auth_token` server-side via `bridgeAuth`. Authenticated users see their profile, a dedicated **Sign Out** option, and full access to articles, while unauthenticated visitors are presented with a streamlined **Sign In** view.
- **Conditional Server-Side Rendering:** Fetches publications dynamically from the database (`cache: 'no-store'`) exclusively for logged-in users.
- **Environment Monitor Sidebar:** A dedicated visual widget showing real-time gateway and database state for local testing.

---

## 📁 Application Architecture & Routes

The project has transitioned from static prototypes and mock data to a fully integrated, database-backed application.

### 🌐 Pages & Active Routes

| Route                | File Path                       | Description                                                                                         |
| :------------------- | :------------------------------ | :-------------------------------------------------------------------------------------------------- |
| **Login**            | `src/app/login/page.tsx`        | User authentication interface using email and password.                                             |
| **Sign Up**          | `src/app/signup/page.tsx`       | User registration interface for new account creation.                                               |
| **User Dashboard**   | `src/app/account/page.tsx`      | Displays server-side authenticated profile info, user-specific publications, and sign-out controls. |
| **Dynamic Article**  | `src/app/article/[id]/page.tsx` | Server-rendered views for reading individual blog posts by ID.                                      |
| **Author Portal**    | `src/app/new-post/page.tsx`     | Interactive interface for publishing new articles.                                                  |
| **Translation Tool** | `src/app/translation/page.tsx`  | Dedicated localized translation utility dashboard.                                                  |

### 🔌 Core API Infrastructure (`src/app/api/...`)

- **Authentication Handlers:**
  - `/api/auth/login/route.ts` — Handles email-based authentication and session token generation.
  - `/api/auth/signup/route.ts` — Validates and registers new user accounts in the database.
  - `/api/auth/signout/route.ts` — Dedicated endpoint to handle session teardown and signout logic.
  - `/api/auth/callback/route.ts` — OAuth/Auth bridge callback handler.
- **Global Feed:** `/api/posts/route.ts` — Core handler to fetch global feeds (`GET`) from Prisma and submit new posts (`POST`).
- **Post Lifecycle:** `/api/posts/[id]/route.ts` — Restricted dynamic node for managing specific post payloads via Prisma queries for authenticated users only.
- **Comments Thread:** `/api/posts/[id]/comments/route.ts` — Isolated interaction lifecycle handler managing post comments in the database.
- **Author Queries:** `/api/posts/author/[id]/route.ts` — Filtered query node to fetch posts by specific author ID.
- **Metrics:** `/api/posts/interact/route.ts` — High-performance atomic endpoint for processing like and bookmark metrics.
- **Translation:** `/api/translate/route.ts` — Fault-tolerant translation service mapping external payload models.

### 🧩 Core UI Components

- `CommentSection.tsx` — Safe client-side feed handling text submissions driven by strict `Comment` types and `SyntheticEvent` mapping.
- `ReactionButton.tsx` — Predictive engagement widget that handles likes or locks UI interaction based on cookie auth contexts.
- `NewPostForm.tsx` — Submission wrapper executing server-synchronized blog posts.

---

## 🔄 Core Architectural Upgrades (Recent Changes)

### 1. Dedicated Sign-Out & Authentication Flow Refinements

- **Sign-Out API Endpoint:** Added `/api/auth/signout` to safely destroy user authentication sessions.
- **Navigation Integration:** Embedded native **Sign Out** buttons into both the **Home Page** header and the **User Dashboard (`/account`)**.
- **Protected Dynamic Post Fetching:** Restructured `/api/posts/[id]` to enforce authentication checks so post data is restricted to verified sessions.

### 2. Database Schema & Prisma ORM Updates

- **Schema Enhancements:** Updated `prisma/schema.prisma` to include a required `password` string field on the `User` model.
- **Prisma Client Singleton Cleanup:** Standardized Prisma client imports across `src/app/account/page.tsx` and `src/inapp/lib/prisma.ts`.
- **Database Migration (Mock DB → Prisma ORM):** Completely removed `src/inapp/lib/mock-db.ts` and transitioned all query nodes to Prisma client calls.

### 3. TypeScript Config Cleanups

- **Alias Pruning:** Cleaned up unused path aliases in `tsconfig.json` to keep build resolutions lean and strict.

### 4. Auth Flow Redesign: Username → Email Authentication

- **Primary Identifier:** Shifted primary authentication credential from usernames to verified email addresses across all auth services and forms.
- **Dedicated Auth Pages:** Introduced native UI flows for `/login` and `/signup`.
- **Refactored `bridge-auth.service.ts`:** Updated session verification and token payloads to operate on email-based contexts.

### 5. Dynamic Routing & Author Query Updates

- **Dynamic Article Routing:** Standardized dynamic rendering under `src/app/article/[id]/`.
- **Author Query Node:** Updated author endpoints to query by unique user IDs (`/api/posts/author/[id]`) instead of usernames for better database indexing.

### 6. Cross-Platform Line Ending Normalization

- Configured `.gitattributes` at the project root (`* text=auto eol=lf`) to enforce Unix **LF** line endings across all developer environments (Windows, macOS, Linux) and build pipelines.

---

## 🚀 Getting Started

### 1. Installation

Install project dependencies:

````bash
npm install

### 2. Database Setup (Prisma)

Generate the Prisma Client and push the schema updates (including user passwords) to your database:

```bash
npx prisma generate
npx prisma db push

### 3. Local Development

Run the local server with hot module reloading (HMR):

```bash
npm run dev
Open http://localhost:3723 in your browser to view the application.

### 4. Database Management (Prisma Studio)
To visually inspect or edit records directly in your database:

```bash
npx prisma studio
Note: Opens locally at http://localhost:51212. Remember to click "Save changes" in the browser after editing or deleting records.

### 5. Testing with Production Optimization
To verify server-rendered behaviors, runtime performance optimizations, and compiled type security, execute the production sequence:

```bash
# Compile and validate TypeScript interfaces & Prisma models
npm run build
````
