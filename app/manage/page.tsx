import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import HeaderV1S1 from '@/components/header.v1s1';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { getManagedArticlePosts } from '@/services/articles/articles';

type ManagedArticle = Awaited<ReturnType<typeof getManagedArticlePosts>>[number];

function getArticlePath(post: ManagedArticle): string {
  if (!post.slug) {
    return `/article/${post.id}`;
  }

  return `/article/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
}

function getArticleEditPath(post: ManagedArticle): string {
  return `/compose?article=${encodeURIComponent(getArticlePath(post).replace('/article/', ''))}`;
}

function formatManageDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getPostExcerpt(content: string): string {
  const normalizedContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (normalizedContent.length <= 120) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 117)}...`;
}

async function getManagedPosts(userId: string) {
  try {
    return await getManagedArticlePosts(userId);
  } catch (error) {
    console.error('Failed loading managed publications:', error);
    return [];
  }
}

export default async function ManagePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/unauthorized');
  }

  const user = await verifyTokenWithBridge(token);

  if (!user) {
    redirect('/unauthorized');
  }

  const posts = await getManagedPosts(user.id);
  const totalReactions = posts.reduce((sum, post) => sum + post.reactions.length, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
  const displayName = user.username || user.email.split('@')[0];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <section className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">
              Manage
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Publications
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review, edit, and open the stories published by @{displayName}.
            </p>
          </div>

          <Link
            href="/compose"
            className="inline-flex h-10 items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            New post
          </Link>
        </div>

        <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
          <div className="bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Posts
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{posts.length}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Reactions
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{totalReactions}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Comments
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{totalComments}</p>
          </div>
        </div>

        {posts.length === 0 ? (
          <section className="mt-8 border border-dashed border-slate-300 bg-slate-50 p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              No posts to manage
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Published drafts will appear here with editing shortcuts and response totals.
            </p>
            <Link
              href="/compose"
              className="mt-6 inline-flex h-10 items-center border border-slate-950 bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Write a post
            </Link>
          </section>
        ) : (
          <section className="mt-8 overflow-x-auto border border-slate-200">
            <div className="grid min-w-[52rem] grid-cols-[minmax(18rem,1fr)_8rem_8rem_10rem_9rem] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              <span>Title</span>
              <span>Reactions</span>
              <span>Comments</span>
              <span>Updated</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="min-w-[52rem] divide-y divide-slate-200">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="grid grid-cols-[minmax(18rem,1fr)_8rem_8rem_10rem_9rem] items-center px-4 py-4 text-sm"
                >
                  <div className="min-w-0 pr-6">
                    <Link
                      href={getArticlePath(post)}
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
                  <span className="text-slate-600">{formatManageDate(post.updatedAt)}</span>
                  <div className="flex justify-end gap-3">
                    <Link
                      href={getArticlePath(post)}
                      className="font-medium text-slate-600 transition-colors hover:text-slate-950"
                    >
                      View
                    </Link>
                    <Link
                      href={getArticleEditPath(post)}
                      className="font-medium text-blue-600 transition-colors hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
