# Getting Started

Please install the following packages before working on this application.
neup.core -> https://github.com/neupgroup/neup.core -> then rename "neup.core" to "core"
neup.logica -> https://github.com/neupgroup/neup.logica -> then rename "neup.logica" to "logica"

* Core is a system wide (non application specific code that contains helpers database functions, helper functions and abstraction layers to work on the database.)

* Logica is a SDK to access the data from the account management system and other applications of the neup ecosystem. Logica will later contain API and GRPC abstractions to connection to this application as well.


# 🚀 Next.js TypeScript Blog Engine & Translation Portal

A dynamic, fully featured blog application built inside the `src` directory as a core internship project. The application features dynamic routing, an optimized local data persistence layer, interactive engagement widgets, translations via multi-vendor API fallbacks, and server-side authenticated route controls.

---

## 🛠️ Tech Stack & Architecture

* **Framework:** Next.js (App Router Architecture)
* **Language:** TypeScript (Strict Type Compliance)
* **State & Auth:** Custom Mock Authentication Service (`bridge-auth.service.ts`)
* **Data Layer:** In-memory decoupled mock database (`mock-db.ts`)

---

## 🏠 Homepage Features

* **Clean Developer Theme:** High-contrast dark mode optimized for readability.
* **Server-Side Rendering:** Fetches posts dynamically on the server side using Next.js (`cache: 'no-store'`).
* **JWT Auth Integration:** Checks for `auth_token` cookies server-side to automatically display user profiles in the navbar.
* **Environment Monitor Sidebar:** A dedicated visual widget showing the current database state (Mock vs. Production) for easier local testing.

## 📁 Application Architecture & Routes

The project has transitioned from static prototypes to a dynamic, backend-driven data model.

### 🌐 Pages & Active Routes

| Route | File Path | Description |
| :--- | :--- | :--- |
| **User Dashboard** | `src/app/account/page.tsx` | Displays server-side authenticated profile info and user-specific publications. |
| **Dynamic Article** | `src/app/article/[id]/page.tsx` | Server-rendered views for reading individual blog posts by ID. |
| **Author Portal** | `src/app/new-post/page.tsx` | Interactive interface for publishing new articles. |
| **Translation Tool** | `src/app/translation/page.tsx` | Dedicated localized translation utility dashboard. |

### 🔌 Core API Infrastructure (`src/app/api/...`)

* **Authentication:** `/api/auth/callback/route.ts` — OAuth/Auth bridge callback handler.
* **Global Feed:** `/api/posts/route.ts` — Core handler to read global feeds (`GET`) and handle new submissions securely (`POST`).
* **Post Lifecycle:** `/api/posts/[id]/route.ts` — Dynamic node for managing specific post payloads.
* **Comments Thread:** `/api/posts/[id]/comments/route.ts` — Isolated interaction lifecycle handler managing post comments.
* **Author Queries:** `/api/posts/author/[username]/route.ts` — Filtered query node to fetch posts by specific authors.
* **Metrics:** `/api/posts/interact/route.ts` — High-performance atomic endpoint for processing like and bookmark metrics.
* **Translation:** `/api/translate/route.ts` — Fault-tolerant translation service mapping external payload models.

### 🧩 Core UI Components

* `CommentSection.tsx` — Safe client-side feed handling text submissions driven by strict `Comment` types and `SyntheticEvent` mapping.
* `ReactionButton.tsx` — Predictive engagement widget that handles likes or locks UI interaction based on cookie auth contexts.
* `NewPostForm.tsx` — Submission wrapper executing server-synchronized blog posts.

---

## 🔄 Core Architectural Upgrades (Recent Changes)

### 1. Shifted to True Dynamic Routing
> **Breaking Change:** Completely deleted the static placeholder route (`src/app/article/page.tsx`) and implemented dynamic paths (`src/app/article/[id]/`). 

The system now reads contextual URL arguments natively without requiring manual code overrides to swap articles.

### 2. Introduction of Unified Mock DB (`src/lib/mock-db.ts`)
* **Decoupled Mock Layer:** Built an in-memory unified database array (`globalBlogPosts`) to orchestrate state centrally.
* **Native Feeds Optimization:** Implemented `unshift()` arrays inside the post APIs to ensure that new articles immediately filter to the top of the timeline feed dynamically.

### 3. Hardened Environment & Security Verification
* **Auth Failure Protection (`src/lib/bridge-auth.service.ts`):** Upgraded token handlers to catch missing parameter contexts gracefully. Embedded strict warning boundaries to notify engineers instantly if an environment key (`AUTH_MOCK_TOKEN`) is absent at initialization.
* **Robust Third-Party Mapping (`src/app/api/translate/route.ts`):** Constructed a unified `VendorTranslationResponse` contract interface. The API defenses smoothly resolve variable vendor return structures (`translatedText` vs `translated_text`), returning clean fallback blocks or `502 Bad Gateway` flags upon unexpected structural damage.

---

## 🚀 Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install 
2. Local Development
Run the local server with hot module reloading (HMR):

Bash
npm run dev
Open http://localhost:3000 to view the application.

3. Testing with Production Optimization
To verify exact server-rendered behaviors, runtime performance optimizations, and compiled type security, execute the production sequence:

Bash
# Compile and validate TypeScript interfaces
npm run build

# Boot local production environment
npm run start