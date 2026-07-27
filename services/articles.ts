/*
::neup.documentation::article-service
::title Article Service

Provides reusable server-side article lookup helpers for routes and pages.

::public

Use these helpers when reading articles by id or canonical slug so pages do not call internal HTTP API routes during server rendering.

::public end

::end
*/

import { prisma } from '@/inapp/lib/prisma';

export function getArticleLookupFromSlug(slug: string): { id: string; slug: string } {
  const slugParts = slug.split('-');

  return {
    id: slugParts[slugParts.length - 1] || slug,
    slug,
  };
}

export async function getArticleBySlugOrId(slug: string) {
  const articleLookup = getArticleLookupFromSlug(slug);

  return prisma.article.findFirst({
    where: {
      OR: [
        { id: articleLookup.id },
        { slug: articleLookup.slug },
      ],
    },
    include: {
      author: {
        select: { id: true, username: true, email: true, role: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          reactions: true,
        },
      },
    },
  });
}

export async function getArticleFeed() {
  return prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { id: true, username: true, email: true, role: true },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });
}

export async function getArticleOwnershipBySlugOrId(slug: string) {
  const articleLookup = getArticleLookupFromSlug(slug);

  return prisma.article.findFirst({
    where: {
      OR: [
        { id: articleLookup.id },
        { slug: articleLookup.slug },
      ],
    },
    select: { id: true, authorId: true },
  });
}
