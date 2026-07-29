# Todo

- Fix existing TypeScript failures in `neup.core` and `neup.logica`, including unresolved alias imports, missing dependencies, implicit `any` parameters, and the `BufferSource` type mismatch.
- Fix existing lint failures in `inapp/lib/prisma.ts`, `neup.core`, and `neup.logica`, including explicit `any` usage, unsafe function typing, effect state updates, and stale eslint-disable comments.
- Fix the existing `ComposeMediaBlocks` render-time state update warning where `syncContent` calls `onContentChange` while `ComposeMediaBlocks` is rendering.
- Apply the live database migration from `User` to `account`; `prisma db push --accept-data-loss` is blocked by existing `Reaction` rows and the safer remote SQL migration needs explicit approval.
