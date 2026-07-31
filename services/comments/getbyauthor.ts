/*
::neup.documentation::comment-service-get-by-author
::title Get Comments By Author Service

Reads comments written by a single author.

::public

Use `getCommentsByAuthor(authorId)` to fetch a user's comments with their related article metadata, newest first.

::public end

::end
*/

import { prisma } from '@/inapp/lib/prisma';

export async function getCommentsByAuthor(authorId: string) {
  return prisma.comment.findMany({
    where: { authorId },
    include: {
      article: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
