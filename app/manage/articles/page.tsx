/*
::neup.documentation::manage-articles-page
::title Manage Articles Page

Provides the authenticated user's article inventory inside the management area.

::public

Use `/manage/articles` to scan managed articles, inspect engagement counts, and open detail, edit, or public-view flows.

::public end

::end
*/

import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import HeaderV1S1 from '@/components/header.v1s1';
import ManageShell from '@/components/ManageShell';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { getManagedArticlePosts } from '@/services/articles/articles';

type ManagedArticle = Awaited<ReturnType<typeof getManagedArticlePosts>>[number];

function getPublicArticlePath(post: ManagedArticle): string {
  return `/article/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
}

function getManagedArticlePath(post: ManagedArticle): string {
  return `/manage/articles/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
}

function getArticleEditPath(post: ManagedArticle): string {
  return `/compose?article=${encodeURIComponent(post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`)}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getPostExcerpt(content: string): string {
  const normalizedContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (normalizedContent.length <= 100) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 97)}...`;
}

export default async function ManageArticlesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/unauthorized');
  }

  const user = await verifyTokenWithBridge(token);

  if (!user) {
    redirect('/unauthorized');
  }

  const posts = await getManagedArticlePosts(user.id);
  const totalReactions = posts.reduce((sum, post) => sum + post.reactions.length, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <ManageShell
        activeSection="articles"
        ctaHref="/compose"
        ctaLabel="New post"
        description="Browse every managed article with current response counts and direct links to detailed management views."
        metrics={[
          { label: 'Posts', value: posts.length },
          { label: 'Reactions', value: totalReactions },
          { label: 'Comments', value: totalComments },
        ]}
        title="Articles"
      >
        {posts.length === 0 ? (
          <section className="border border-dashed border-slate-300 bg-slate-50 p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              No articles to manage
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Publish a draft first, then return here to review engagement and manage each story.
            </p>
            <Link
              href="/compose"
              className="mt-6 inline-flex h-10 items-center border border-slate-950 bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Write a post
            </Link>
          </section>
        ) : (
          <section className="overflow-x-auto border border-slate-200">
            <div className="grid min-w-[68rem] grid-cols-[minmax(20rem,1.2fr)_7rem_7rem_10rem_16rem] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              <span>Article</span>
              <span>Likes</span>
              <span>Replies</span>
              <span>Updated</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="min-w-[68rem] divide-y divide-slate-200">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="grid grid-cols-[minmax(20rem,1.2fr)_7rem_7rem_10rem_16rem] items-center px-4 py-4 text-sm"
                >
                  <div className="min-w-0 pr-6">
                    <Link
                      href={getManagedArticlePath(post)}
                      className="block truncate font-semibold text-slate-950 transition-colors hover:text-blue-600"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 line-clamp-1 text-slate-500">
                      {getPostExcerpt(post.content) || 'No body content.'}
                    </p>
                  </div>
                  <span className="font-mono text-slate-600">{post.reactions.length}</span>
                  <span className="font-mono text-slate-600">{post.comments.length}</span>
                  <span className="text-slate-600">{formatDate(post.updatedAt)}</span>
                  <div className="flex justify-end gap-4 text-sm font-medium">
                    <Link
                      href={getManagedArticlePath(post)}
                      className="text-slate-600 transition-colors hover:text-slate-950"
                    >
                      Manage
                    </Link>
                    <Link
                      href={getPublicArticlePath(post)}
                      className="text-slate-600 transition-colors hover:text-slate-950"
                    >
                      View
                    </Link>
                    <Link
                      href={getArticleEditPath(post)}
                      className="text-blue-600 transition-colors hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </ManageShell>
    </main>
  );
}
