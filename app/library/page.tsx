/*
::neup.documentation::library-page
::title Library Page

Provides a protected library view for the authenticated user's saved, commented, and reacted article activity.

::public

Use `/library` to review a user's saved placeholder state, their recent comments, and their recent reactions.

::public end

::end
*/

import { cookies } from 'next/headers';
import Link from 'next/link';
import HeaderV1S1 from '@/components/header.v1s1';
import SidebarNav, { getSharedSidebarSections } from '@/components/SidebarNav';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { getCommentsByAuthor } from '@/services/comments/getbyauthor';
import { getReactionsByUser } from '@/services/reactions/getbyuser';

type UserComments = Awaited<ReturnType<typeof getCommentsByAuthor>>;
type UserReactions = Awaited<ReturnType<typeof getReactionsByUser>>;

function getArticlePath(article: { id: string; slug: string | null }) {
  if (!article.slug) {
    return `/article/${article.id}`;
  }

  return `/article/${article.slug.endsWith(`-${article.id}`) ? article.slug : `${article.slug}-${article.id}`}`;
}

function formatLibraryDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getUniqueCommentedArticles(comments: UserComments) {
  const articleMap = new Map<string, UserComments[number]>();

  comments.forEach((comment) => {
    if (!articleMap.has(comment.article.id)) {
      articleMap.set(comment.article.id, comment);
    }
  });

  return Array.from(articleMap.values());
}

function getUniqueReactedArticles(reactions: UserReactions) {
  const articleMap = new Map<string, UserReactions[number]>();

  reactions.forEach((reaction) => {
    if (!articleMap.has(reaction.article.id)) {
      articleMap.set(reaction.article.id, reaction);
    }
  });

  return Array.from(articleMap.values());
}

export default async function LibraryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifyTokenWithBridge(token) : null;

  if (!user) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={null} />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 text-center">
          <section className="max-w-md border border-slate-200 bg-slate-50 p-8">
            <p className="font-medium text-red-600">Access Denied.</p>
            <p className="mt-2 text-sm text-slate-600">
              Please log in to view your library activity.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const comments = await getCommentsByAuthor(user.id);
  const reactions = await getReactionsByUser(user.id);
  const commentedArticles = getUniqueCommentedArticles(comments);
  const reactedArticles = getUniqueReactedArticles(reactions);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 lg:grid-cols-[18.25rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 px-6 py-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:bg-white lg:px-6 lg:py-10">
          <SidebarNav sections={getSharedSidebarSections('library')} />
        </aside>

        <div className="min-w-0 px-6 py-10 sm:px-10 lg:px-0 lg:pb-16 lg:pl-20 lg:pr-20 lg:pt-16">
          <div className="max-w-[60rem]">
            <header className="border-b border-slate-200 pb-8">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">
                Library
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Library
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Review what you have saved, where you have commented, and which articles you have reacted to.
              </p>
            </header>

            <div className="mt-8 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Saved
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">0</p>
              </div>
              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Commented
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{commentedArticles.length}</p>
              </div>
              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Reacted
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{reactedArticles.length}</p>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              <section className="border border-slate-200">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-semibold text-slate-950">Saved</h2>
                </div>
                <div className="px-5 py-5 text-sm leading-6 text-slate-500">
                  Saved items will appear here once article saving is available in the current schema.
                </div>
              </section>

              <section className="border border-slate-200">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-semibold text-slate-950">Commented On</h2>
                </div>

                {commentedArticles.length === 0 ? (
                  <div className="px-5 py-5 text-sm text-slate-500">
                    No commented articles yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {commentedArticles.map((comment) => (
                      <article key={comment.article.id} className="px-5 py-5">
                        <Link
                          href={getArticlePath(comment.article)}
                          className="text-lg font-semibold text-slate-950 transition-colors hover:text-blue-600"
                        >
                          {comment.article.title}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {comment.content}
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                          Commented {formatLibraryDate(comment.createdAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="border border-slate-200">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-semibold text-slate-950">Reacted To</h2>
                </div>

                {reactedArticles.length === 0 ? (
                  <div className="px-5 py-5 text-sm text-slate-500">
                    No reacted articles yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {reactedArticles.map((reaction) => (
                      <article key={reaction.article.id} className="flex items-center justify-between gap-4 px-5 py-5">
                        <div className="min-w-0">
                          <Link
                            href={getArticlePath(reaction.article)}
                            className="block truncate text-lg font-semibold text-slate-950 transition-colors hover:text-blue-600"
                          >
                            {reaction.article.title}
                          </Link>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                            {reaction.type} on {formatLibraryDate(reaction.createdAt)}
                          </p>
                        </div>
                        <Link
                          href={getArticlePath(reaction.article)}
                          className="shrink-0 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
                        >
                          Open
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
