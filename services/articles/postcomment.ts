/*
::neup.documentation::article-service-post-comment
::title Post Article Comment Service

Creates a comment on an article and returns the article's updated comments.

::public

Use `postArticleComment(articleId, authorId, content)` to persist a comment and fetch the refreshed comment list with author details.

::public end

::end
*/

import { prisma } from '@/inapp/lib/prisma';

export async function postArticleComment(articleId: string, authorId: string, content: string) {
  await prisma.comment.create({
    data: {
      articleId,
      authorId,
      content,
    },
  });

  return prisma.comment.findMany({
    where: { articleId },
    include: {
      author: {
        select: { id: true, displayName: true, neupId: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
