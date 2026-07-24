import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { ReactionButton } from '@/components/ReactionButton';
import { CommentSection } from '@/components/CommentSection';

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
  const { id } = await params;

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
  const post = await getPostFromApi(id, token);

  // Fallback if article is not found
  if (!post) {
    return (
      <main className="min-h-screen bg-[#131710] text-[#e2e8f0] px-6 py-16">
        <section className="mx-auto max-w-2xl border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff99c9]">
            Missing Article
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
            Article Not Found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#c1bddb]/80">
            The article you are looking for does not exist or is no longer available.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-10 items-center justify-center border border-[#58fcec]/40 px-4 text-sm font-bold text-[#58fcec] transition-colors hover:bg-[#58fcec] hover:text-[#131710]"
          >
            Back to publications
          </Link>
        </section>
      </main>
    );
  }

  // Format author display name safely (handles strings, objects, and email fallbacks)
  const authorDisplayName =
    typeof post.author === 'object' && post.author !== null
      ? post.author.username || post.author.email?.split('@')[0]
      : post.author;

  const commentsCount = post.comments?.length ?? 0;
  const likesCount = post.likes ?? post.reactions?.length ?? 0;

  return (
    <main className="min-h-screen bg-[#131710] text-[#e2e8f0] antialiased selection:bg-[#58fcec] selection:text-[#131710]">
      <nav className="border-b border-[#a2c7e5]/10 bg-[#131710]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-[0.18em] text-[#58fcec] transition-colors hover:text-white"
          >
            Publications
          </Link>
          <Link
            href="/account"
            className="border border-[#a2c7e5]/20 px-3 py-1.5 text-xs font-bold text-[#a2c7e5] transition-colors hover:border-[#58fcec]/50 hover:text-[#58fcec]"
          >
            @{user.username || user.email.split('@')[0]}
          </Link>
        </div>
      </nav>

      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-10 md:py-14">
        <article className="space-y-8">
          <header className="border-b border-[#a2c7e5]/10 pb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#ff99c9]">
              <span>@{authorDisplayName || 'Anonymous'}</span>
              <span className="text-[#a2c7e5]/30">/</span>
              <span className="text-[#a2c7e5]/70">ID #{post.id.slice(-6)}</span>
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-mono text-[#a2c7e5]/80">
              <span className="border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 px-2.5 py-1">
                {likesCount} likes
              </span>
              <span className="border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 px-2.5 py-1">
                {commentsCount} comments
              </span>
            </div>
          </header>

          <div className="max-w-3xl whitespace-pre-line text-base leading-8 text-[#d8d5e8] md:text-lg md:leading-9">
            {post.content}
          </div>
        </article>

        <section className="border-t border-[#a2c7e5]/10 pt-8">
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
