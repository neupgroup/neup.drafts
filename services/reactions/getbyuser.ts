/*
::neup.documentation::reaction-service-get-by-user
::title Get Reactions By User Service

Reads reactions created by a single user.

::public

Use `getReactionsByUser(userId)` to fetch a user's article reactions with related article metadata, newest first.

::public end

::end
*/

import { prisma } from '@/inapp/lib/prisma';

export async function getReactionsByUser(userId: string) {
  return prisma.reaction.findMany({
    where: { userId },
    include: {
      article: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
