# Neup Drafts

A full-stack technical blog platform built with Next.js, TypeScript, React, Prisma, and PostgreSQL.

The application provides article publishing, centralized authentication, comments, reactions, authorization, and translation functionality through a server-side architecture.

## Tech Stack

Framework: Next.js 16 (App Router)

Language: TypeScript

UI: React 19

Styling: Tailwind CSS

Database: PostgreSQL

ORM: Prisma

Validation: Valibot

Authentication: Centralized authentication service

Runtime: Node.js

## Project Structure

```text
.
├── app/                    # Pages and API routes
│   ├── api/                # Backend API routes
│   ├── article/            # Public article pages
│   ├── compose/            # Article creation
│   ├── manage/             # Protected management UI
│   ├── profile/            # User profile
│   └── search/             # Article search
│
├── components/             # Shared UI components
│   ├── editor/             # Editor blocks/components
│   ├── CommentSection.tsx
│   ├── ReactionButton.tsx
│   ├── TranslationWidget.tsx
│   └── ...
│
├── inapp/
│   └── lib/                # Application authentication layer
│       ├── auth-guard.ts
│       ├── auth-redirect.ts
│       ├── bridge-auth.service.ts
│       ├── permissions.ts
│       └── prisma.ts
│
├── services/               # Application/business logic
│   ├── articles/
│   ├── comments/
│   └── reactions/
│
├── core/                   # Shared/core infrastructure
├── logica/                 # Shared NEUP/application logic
│
├── prisma/
│   └── schema.prisma       # Database schema
│
├── proxy.ts                # /manage route protection
├── next.config.ts
├── tsconfig.json
└── package.json

Generated dependencies and build output such as node_modules and .next are intentionally excluded from the project structure.

## Features

- Centralized authentication and authorization
- Article creation, publishing, and management
- Search and content library
- Comments and reactions
- Translation support
- Responsive user interface

## Authentication & Authorization

Authentication is handled centrally through the Neup authentication infrastructure rather than being implemented as an independent authentication system within the blog application.

The blog uses the central authentication service to:

- Authenticate users and manage sessions
- Identify the authenticated account
- Control access to protected functionality

Application-specific authorization and permissions are handled within the blog, while authentication remains centralized across the Neup ecosystem.

## Architecture

The application uses the Next.js App Router to combine server-rendered pages, client-side components, and API route handlers within a single application.

The main application layers are:

Routes & Pages — User-facing screens and dynamic routes.

API Routes — Server-side request handling.

Components — Reusable UI components.

Services — Application-specific business logic and data access.

Authentication — Integration with the centralized Neup authentication infrastructure.

Prisma — Database access and schema management.

PostgreSQL — Persistent data storage.

## Getting Started

### Prerequisites

Make sure the following are installed:

Node.js

npm

PostgreSQL

Git

### Installation

Clone the repository and install the dependencies:

git clone <repository-url>
cd neup.drafts
npm install

### Environment Configuration

Create a local environment file:

.env

Configure the required database and application environment variables before starting the application.

### Database Setup

Generate the Prisma client:

npx prisma generate

Apply the Prisma schema to the configured PostgreSQL database:

npx prisma db push

### Development

Start the development server:

npm run dev

The application runs on:

http://localhost:3723

### Production Build

Create a production build:

npm run build

Start the production server:

npm run start

### Prisma Studio

To inspect the database during development:

npx prisma studio

### Available Scripts

Command Description

npm run dev - Starts the development server
npm run build - Creates a production build
npm run start - Starts the production server
npm run lint - Runs ESLint
npx prisma generate - Generates the Prisma client
npx prisma db push - Applies the Prisma schema to the database
npx prisma studio - Opens Prisma Studio

### Development Notes

The project uses custom setup scripts that run during installation, development, and build processes. These scripts integrate the shared Neup ecosystem dependencies and project configuration.

The application is intended to be developed using the project's configured environment and shared Neup packages.
```
