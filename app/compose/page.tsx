import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ComposePostForm from "@/components/editor/ComposePostForm";
import HeaderV1S1 from "@/components/header.v1s1";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import { prisma } from "@/inapp/lib/prisma";

interface ComposePageProps {
  searchParams: Promise<{
    article?: string | string[];
  }>;
}

function getArticleLookup(article: string): { id: string; slug: string } {
  const articleSegmentParts = article.split("-");
  return {
    id: articleSegmentParts[articleSegmentParts.length - 1] || article,
    slug: article,
  };
}

export default async function ComposePage({ searchParams }: ComposePageProps) {
  const query = await searchParams;
  const articleParam = Array.isArray(query.article)
    ? query.article[0]
    : query.article;

  const cookieStore = await cookies();

  const authAccountToken = cookieStore.get("auth_account")?.value ?? null;

  const authResult = await bridgeAuth.checkAuthentication(authAccountToken);

  if (!authResult.authenticated) {
    redirect("/unauthorized");
  }

  const user = await bridgeAuth.getCurrentAccount(authAccountToken);

  if (!user) {
    redirect("/unauthorized");
  }

  if (!articleParam) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={user} />

        <section className="mx-auto max-w-4xl px-6 py-8">
          <ComposePostForm />
        </section>
      </main>
    );
  }

  const articleLookup = getArticleLookup(articleParam);
  const article = await prisma.article.findFirst({
    where: {
      OR: [{ id: articleLookup.id }, { slug: articleLookup.slug }],
    },
    select: {
      id: true,
      title: true,
      content: true,
      slug: true,
      authorId: true,
    },
  });

  if (!article) {
    redirect("/compose");
  }

  const canEdit = article.authorId === user.id || user.status === "ADMIN";

  if (!canEdit) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <section className="mx-auto max-w-4xl px-6 py-8">
        <ComposePostForm article={article} />
      </section>
    </main>
  );
}
