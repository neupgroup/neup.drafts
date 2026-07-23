# Getting Started

Please install the following packages before working on this application.
neup.core -> https://github.com/neupgroup/neup.core -> then rename "neup.core" to "core"
neup.logica -> https://github.com/neupgroup/neup.logica -> then rename "neup.logica" to "logica"

* Core is a system wide (non application specific code that contains helpers database functions, helper functions and abstraction layers to work on the database.)

* Logica is a SDK to access the data from the account management system and other applications of the neup ecosystem. Logica will later contain API and GRPC abstractions to connection to this application as well.


# 🚀 Next.js TypeScript Blog Engine & Translation Portal

A dynamic, fully featured blog application built inside the `src` directory as a core internship project. The application features dynamic routing, a persistent database layer powered by Prisma ORM, interactive engagement widgets, translations via multi-vendor API fallbacks, and server-side authenticated route controls.

---

## 🛠️ Tech Stack & Architecture

* **Framework:** Next.js (App Router Architecture)
* **Language:** TypeScript (Strict Type Compliance)
* **Database & ORM:** Prisma ORM with SQLite / PostgreSQL (Replaced legacy mock DB)
* **State & Auth:** Custom Authentication Service (`bridge-auth.service.ts`) using Email credentials
* **Line Ending Normalization:** Enforced cross-platform consistency via `.gitattributes` (`eol=lf`)

---

## 🏠 Homepage Features

* **Clean Developer Theme:** High-contrast dark mode optimized for readability.
* **Server-Side Rendering:** Fetches posts dynamically on the server side using Next.js (`cache: 'no-store'`).
* **JWT & Cookie Auth Integration:** Checks for auth cookies server-side to automatically display user profiles in the navbar.
* **Environment Monitor Sidebar:** A dedicated visual widget showing the current database state for easier local testing.

---

## 📁 Application Architecture & Routes

The project has transitioned from static prototypes and mock data to a fully integrated, database-backed application.

### 🌐 Pages & Active Routes

| Route | File Path | Description |
| :--- | :--- | :--- |
| **Login** | `src/app/login/page.tsx` | User authentication interface using email and password. |
| **Sign Up** | `src/app/signup/page.tsx` | User registration interface for new account creation. |
| **User Dashboard** | `src/app/account/page.tsx` | Displays server-side authenticated profile info and user-specific publications. |
| **Dynamic Article** | `src/app/article/[id]/page.tsx` | Server-rendered views for reading individual blog posts by ID. |
| **Author Portal** | `src/app/new-post/page.tsx` | Interactive interface for publishing new articles. |
| **Translation Tool** | `src/app/translation/page.tsx` | Dedicated localized translation utility dashboard. |

### 🔌 Core API Infrastructure (`src/app/api/...`)

* **Authentication Handlers:**
  * `/api/auth/login/route.ts` — Handles email-based authentication and session token generation.
  * `/api/auth/signup/route.ts` — Validates and registers new user accounts in the database.
  * `/api/auth/callback/route.ts` — OAuth/Auth bridge callback handler.
* **Global Feed:** `/api/posts/route.ts` — Core handler to fetch global feeds (`GET`) from Prisma and submit new posts (`POST`).
* **Post Lifecycle:** `/api/posts/[id]/route.ts` — Dynamic node for managing specific post payloads via Prisma queries.
* **Comments Thread:** `/api/posts/[id]/comments/route.ts` — Isolated interaction lifecycle handler managing post comments in the database.
* **Author Queries:** `/api/posts/author/[id]/route.ts` — Filtered query node to fetch posts by specific author ID.
* **Metrics:** `/api/posts/interact/route.ts` — High-performance atomic endpoint for processing like and bookmark metrics.
* **Translation:** `/api/translate/route.ts` — Fault-tolerant translation service mapping external payload models.

### 🧩 Core UI Components

* `CommentSection.tsx` — Safe client-side feed handling text submissions driven by strict `Comment` types and `SyntheticEvent` mapping.
* `ReactionButton.tsx` — Predictive engagement widget that handles likes or locks UI interaction based on cookie auth contexts.
* `NewPostForm.tsx` — Submission wrapper executing server-synchronized blog posts.

---

## 🔄 Core Architectural Upgrades (Recent Changes)

### 1. Database Migration: Mock DB → Prisma ORM
> **Breaking Change:** Completely removed `src/inapp/lib/mock-db.ts`.

* **Prisma Integration (`src/inapp/lib/prisma.ts`):** Replaced the legacy in-memory mock database array with a production-ready Prisma client singleton (`prisma.ts`).
* **Database Schema (`prisma/`):** Configured database models and migrations for users, posts, comments, and engagement metrics.
* **Refactored API Endpoints:** All post, comment, and engagement API routes now execute direct async Prisma ORM queries.

### 2. Auth Flow Redesign: Username → Email Authentication
* **Primary Identifier:** Shifted primary authentication credential from usernames to verified email addresses across all auth services and forms.
* **Dedicated Auth Pages:** Introduced native UI flows for `/login` and `/signup`.
* **Refactored `bridge-auth.service.ts`:** Updated session verification and token payloads to operate on email-based contexts.

### 3. Dynamic Routing & Author Query Updates
* **Dynamic Article Routing:** Standardized dynamic rendering under `src/app/article/[id]/`.
* **Author Query Node:** Updated author endpoints to query by unique user IDs (`/api/posts/author/[id]`) instead of usernames for better database indexing.

### 4. Cross-Platform Line Ending Normalization
* Configured `.gitattributes` at the project root (`* text=auto eol=lf`) to enforce Unix **LF** line endings across all developer environments (Windows, macOS, Linux) and build pipelines.

### 5. Hardened Environment & Security Verification
* **Auth Failure Protection (`src/lib/bridge-auth.service.ts`):** Upgraded token handlers to catch missing parameter contexts gracefully. Embedded strict warning boundaries to notify instantly if an environment key (`AUTH_MOCK_TOKEN`) is absent at initialization.
* **Robust Third-Party Mapping (`src/app/api/translate/route.ts`):** Constructed a unified `VendorTranslationResponse` contract interface. The API defenses smoothly resolve variable vendor return structures (`translatedText` vs `translated_text`), returning clean fallback blocks or `502 Bad Gateway` flags upon unexpected structural damage.

---

## 🚀 Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install

### 2. Database Setup (Prisma)
Generate the Prisma Client and push the schema to your local database:

```bash
npx prisma generate
npx prisma db push

### 3. Local Development
Run the local server with hot module reloading (HMR):

```bash
npm run dev
Open http://localhost:3000 to view the application.

4. Testing with Production Optimization
To verify exact server-rendered behaviors, runtime performance optimizations, and compiled type security, execute the production sequence:

Bash
# Compile and validate TypeScript interfaces & Prisma models
npm run build

