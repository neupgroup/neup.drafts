/*
::neup.documentation::reaction-service-get-by-user
::title Get Reactions By User Service

Reads reactions created by a single account.

::public

Use `getReactionsByUser(accountId)` to fetch an account's article reactions with related article metadata, newest first.

::public end

::end
*/

import { prisma } from '@/inapp/lib/prisma';

export async function getReactionsByUser(accountId: string) {
  return prisma.reaction.findMany({
    where: { accountId },
    include: {
      article: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
