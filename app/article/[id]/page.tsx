import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { ReactionButton } from '@/components/ReactionButton';
import { CommentSection } from '@/components/CommentSection';
import HeaderV1S1 from '@/components/header.v1s1';

function getArticleIdFromSlug(slug: string): string {
  const slugParts = slug.split('-');
  return slugParts[slugParts.length - 1] || slug;
}

function getCanonicalArticleSlug(post: { id: string; slug?: string | null }): string {
  if (!post.slug) {
    return post.id;
  }

  return post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`;
}

function getContentBlocks(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

// 1. Fetch data from internal API route
async function getPostFromApi(id: string, token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Always get fresh reactions & comments
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.post;
  } catch (error) {
    console.error("API fetch failed for article:", error);
    return null;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const articleId = getArticleIdFromSlug(slug);

  // Native Server-side Auth verification via Cookie Token
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/unauthorized'); // Kicks unauthenticated users out
  }

  const user = await verifyTokenWithBridge(token);

  if (!user) {
    redirect('/unauthorized'); // Kicks unauthenticated users out
  }

  // 2. Fetch post payload from API
  const post = await getPostFromApi(articleId, token);

  // Fallback if article is not found
  if (!post) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={user} />

        <section className="mx-auto mt-16 max-w-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-rose-600">
            Missing Article
          </p>
          <h1 className="mt-4 text-3xl font-medium tracking-tight text-slate-950">
            Article Not Found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The article you are looking for does not exist or is no longer available.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-10 items-center justify-center border border-blue-300 px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
          >
            Back to publications
          </Link>
        </section>
      </main>
    );
  }

  const canonicalSlug = getCanonicalArticleSlug(post);

  if (canonicalSlug !== slug) {
    redirect(`/article/${canonicalSlug}`);
  }

  // Format author display name safely (handles strings, objects, and email fallbacks)
  const authorDisplayName =
    typeof post.author === 'object' && post.author !== null
      ? post.author.username || post.author.email?.split('@')[0]
      : post.author;

  const commentsCount = post.comments?.length ?? 0;
  const likesCount = post.likes ?? post.reactions?.length ?? 0;
  const contentBlocks = getContentBlocks(post.content);

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-200 selection:text-slate-950">
      <HeaderV1S1 user={user} />

      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-10 md:py-14">
        <article className="space-y-8">
          <header className="border-b border-slate-200 pb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-rose-600">
              <span>@{authorDisplayName || 'Anonymous'}</span>
            </div>

            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-medium leading-tight tracking-tight text-slate-700">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600">
              <span className="border border-slate-200 bg-slate-50 px-2.5 py-1">
                {likesCount} likes
              </span>
              <span className="border border-slate-200 bg-slate-50 px-2.5 py-1">
                {commentsCount} comments
              </span>
            </div>
          </header>

          <div className="max-w-3xl space-y-6 font-serif text-[20px] font-medium leading-8 text-slate-600">
            {contentBlocks.map((block, index) => (
              <p key={index} className="whitespace-pre-line">
                {block}
              </p>
            ))}
          </div>
        </article>

        <section className="border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-8">
            <ReactionButton
              postId={post.id}
              initialLikes={likesCount}
              currentUser={user}
            />

            <CommentSection
              postId={post.id}
              comments={post.comments || []}
              currentUser={user}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
