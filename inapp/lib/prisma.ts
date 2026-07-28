/*
::neup.documentation::core-database-prisma
::title Core Database Prisma Client

Provides the shared Prisma client instance for server-side services and routes.

::public

Import `prisma` from `@/core/database/prisma` whenever application code needs database access.

The module exports both a named `prisma` binding and a default export for compatibility with existing call sites.

::public end

::private

The client uses `pg` with `@prisma/adapter-pg`, and caches the Prisma client on `globalThis` in development to avoid creating duplicate pools during hot reloads.

The delegate guard rebuilds the cached client when the generated Prisma client shape changes after schema updates.

::private end

::end
*/

export { prisma } from '@/core/database/prisma'
export { default } from '@/core/database/prisma'
export { Prisma } from '@/core/database/prisma'
export type * from '@/core/database/prisma'
