/*
::neup.documentation::manage-article-detail-page
::title Manage Article Detail Page

Provides a protected per-article management view for a single owned article.

::public

Use `/manage/articles/[slug]` to inspect an owned article, review recent comments and reactions, and jump into edit or public reading views.

::public end

::end
*/

import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import HeaderV1S1 from '@/components/header.v1s1';
import ManageShell from '@/components/ManageShell';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { getManagedArticleBySlug } from '@/services/articles/articles';

type ManagedArticle = NonNullable<Awaited<ReturnType<typeof getManagedArticleBySlug>>>;

function getPublicArticlePath(post: ManagedArticle): string {
  return `/article/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
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

function getPreviewText(content: string): string {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default async function ManageArticleDetailPage(
  props: PageProps<'/manage/articles/[slug]'>
) {
  const { slug } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/unauthorized');
  }

  const user = await verifyTokenWithBridge(token);

  if (!user) {
    redirect('/unauthorized');
  }

  const post = await getManagedArticleBySlug(user.id, slug);

  if (!post) {
    redirect('/manage/articles');
  }

  const previewText = getPreviewText(post.content);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <ManageShell
        activeSection="articles"
        ctaHref={getArticleEditPath(post)}
        ctaLabel="Edit article"
        description={`Review the operational details for "${post.title}" without leaving the manage workspace.`}
        metrics={[
          { label: 'Reactions', value: post.reactions.length },
          { label: 'Comments', value: post.comments.length },
          { label: 'Updated', value: formatDate(post.updatedAt) },
        ]}
        title={post.title}
      >
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <Link
            href="/manage/articles"
            className="font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            All articles
          </Link>
          <Link
            href={getPublicArticlePath(post)}
            className="font-medium text-blue-600 transition-colors hover:text-blue-800"
          >
            Open public page
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
          <div className="space-y-6">
            <section className="border border-slate-200">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Content preview</h2>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm leading-7 text-slate-600">
                  {previewText || 'No body content.'}
                </p>
              </div>
            </section>

            <section className="border border-slate-200">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Recent comments</h2>
              </div>

              {post.comments.length === 0 ? (
                <div className="px-5 py-5 text-sm text-slate-500">
                  No comments yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {post.comments.slice(0, 6).map((comment) => (
                    <article key={comment.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-slate-900">
                          @{comment.author.neupId || comment.author.displayName || 'anonymous'}
                        </span>
                        <span className="text-slate-400">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {comment.content}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Article details</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Slug</dt>
                  <dd className="truncate font-mono text-slate-700">{post.slug}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-700">{formatDate(post.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Updated</dt>
                  <dd className="text-slate-700">{formatDate(post.updatedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Author</dt>
                  <dd className="text-slate-700">
                    @{post.author.neupId || post.author.displayName || 'anonymous'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="border border-slate-200">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Recent reactions</h2>
              </div>

              {post.reactions.length === 0 ? (
                <div className="px-5 py-5 text-sm text-slate-500">
                  No reactions yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {post.reactions.slice(0, 8).map((reaction) => (
                    <article key={reaction.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">
                          @{reaction.account.neupId || reaction.account.displayName || 'anonymous'}
                        </p>
                        <p className="mt-1 uppercase tracking-[0.14em] text-slate-400">
                          {reaction.type}
                        </p>
                      </div>
                      <span className="text-slate-400">{formatDate(reaction.createdAt)}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </ManageShell>
    </main>
  );
}
