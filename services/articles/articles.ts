/*
::neup.documentation::article-service
::title Article Service

Provides reusable server-side article lookup helpers for routes and pages.

::public

Use these helpers when reading articles by id or canonical slug so pages do not call internal HTTP API routes during server rendering.

::public end

::end
*/

import { prisma } from "@/inapp/lib/prisma";

export function getArticleLookupFromSlug(slug: string): {
  id: string;
  slug: string;
} {
  const slugParts = slug.split("-");

  return {
    id: slugParts[slugParts.length - 1] || slug,
    slug,
  };
}

export async function getArticleBySlugOrId(slug: string) {
  const articleLookup = getArticleLookupFromSlug(slug);

  return prisma.article.findFirst({
    where: {
      OR: [{ id: articleLookup.id }, { slug: articleLookup.slug }],
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          displayImage: true,
          neupId: true,
          status: true,
          isVerified: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              displayImage: true,
              neupId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          displayImage: true,
          neupId: true,
          status: true,
          isVerified: true,
        },
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

export async function getManagedArticlePosts(authorId: string) {
  return prisma.article.findMany({
    where: { authorId },
    include: {
      comments: true,
      reactions: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getManagedArticleBySlug(authorId: string, slug: string) {
  const articleLookup = getArticleLookupFromSlug(slug);

  return prisma.article.findFirst({
    where: {
      authorId,
      OR: [{ id: articleLookup.id }, { slug: articleLookup.slug }],
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          displayImage: true,
          neupId: true,
          status: true,
          isVerified: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              displayImage: true,
              neupId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reactions: {
        include: {
          account: {
            select: {
              id: true,
              displayName: true,
              displayImage: true,
              neupId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getArticleOwnershipBySlugOrId(slug: string) {
  const articleLookup = getArticleLookupFromSlug(slug);

  return prisma.article.findFirst({
    where: {
      OR: [{ id: articleLookup.id }, { slug: articleLookup.slug }],
    },
    select: { id: true, authorId: true },
  });
}
