/*
::neup.documentation::prisma-client-entrypoint
::title Prisma Client Entrypoint

Provides the stable project-local entrypoint for the generated Prisma client.

::public

Import `PrismaClient`, `Prisma`, and generated Prisma types from `@/prisma/client`.

::public end

::private

`core/database/prisma.ts` imports the generated client through the `@/prisma/client` alias.
Prisma generates `client.ts`, but TypeScript resolves directory imports through `index.ts`,
so this barrel keeps the generated output compatible without modifying `@/core`.

::private end

::end
*/

export * from './client'
