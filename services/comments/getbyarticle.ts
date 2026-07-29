/*
::neup.documentation::comment-service-get-by-article
::title Get Comments By Article Service

Reads comments for a single article.

::public

Use `getCommentsByArticle(articleId)` to fetch an article's comments with basic author details, newest first.

::public end

::end
*/

import { prisma } from '@/inapp/lib/prisma';

export async function getCommentsByArticle(articleId: string) {
  return prisma.comment.findMany({
    where: { articleId },
    include: {
      author: {
        select: { id: true, displayName: true, displayImage: true, neupId: true, status: true, isVerified: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
