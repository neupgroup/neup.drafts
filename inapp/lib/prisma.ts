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

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/prisma/generated/client/client'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

function hasRequiredDelegates(client: ReturnType<typeof prismaClientSingleton> | undefined): boolean {
  if (!client) return false

  const candidate = client as any
  return Boolean(
    candidate.portfolio &&
    candidate.portfolioAsset &&
    candidate.member &&
    (candidate.authnSession || candidate.authSession) &&
    (candidate.authnRequest || candidate.authRequest) &&
    (candidate.authnMethod || candidate.authMethod) &&
    (candidate.member || candidate.portfolioRole) &&
    candidate.systemConfig,
  )
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = hasRequiredDelegates(globalThis.prisma)
  ? globalThis.prisma!
  : prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
