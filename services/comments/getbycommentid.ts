/*
::neup.documentation::comment-service-get-by-comment-id
::title Get Comment By Comment Id Service

Reads one comment by its unique id.

::public

Use `getCommentByCommentId(commentId)` to fetch a single comment with its author and article metadata.

::public end

::end
*/

import { prisma } from '@/inapp/lib/prisma';

export async function getCommentByCommentId(commentId: string) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: {
        select: { id: true, username: true, email: true, role: true },
      },
      article: {
        select: { id: true, title: true, slug: true },
      },
    },
  });
}
