# Todo

- Fix existing TypeScript failures in `neup.core` and `neup.logica`, including unresolved alias imports, missing dependencies, implicit `any` parameters, and the `BufferSource` type mismatch.
- Restore or generate `app/generated/prisma/client` so `inapp/lib/prisma.ts` can import the Prisma client at runtime.
- Fix existing lint failures in `inapp/lib/prisma.ts`, `neup.core`, and `neup.logica`, including explicit `any` usage, unsafe function typing, effect state updates, and stale eslint-disable comments.
