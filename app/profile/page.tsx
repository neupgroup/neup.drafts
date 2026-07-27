import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { prisma } from '@/inapp/lib/prisma'; 
import { Prisma } from '@/app/generated/prisma/client';
import HeaderV1S1 from '@/components/header.v1s1';

// Extract the exact return type for Article + included relations
type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: { comments: true; reactions: true };
}>;

function getArticlePath(post: ArticleWithRelations): string {
  if (!post.slug) {
    return `/article/${post.id}`;
  }

  return `/article/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
}

function getArticleEditPath(post: ArticleWithRelations): string {
  return `/compose?article=${encodeURIComponent(getArticlePath(post).replace('/article/', ''))}`;
}

function formatProfileDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getPostExcerpt(content: string): string {
  const normalizedContent = content.replace(/\s+/g, ' ').trim();

  if (normalizedContent.length <= 160) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 157)}...`;
}

// 1. Fetch user articles directly from PostgreSQL via user ID (from verified Token)
async function getUserPosts(userId: string): Promise<ArticleWithRelations[]> {
  try {
    const userPosts = await prisma.article.findMany({
      where: {
        authorId: userId, // Match using the ID extracted directly from the verified token
      },
      include: {
        comments: true,
        reactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return userPosts;
  } catch (error) {
    console.error("Failed loading user publications:", error);
    return [];
  }
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // 2. Decode & verify token to get logged-in user details
  const user = token ? await verifyTokenWithBridge(token) : null;

  if (!user) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={null} />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 text-center">
          <section className="max-w-md border border-slate-200 bg-slate-50 p-8">
            <p className="font-medium text-red-600">Access Denied.</p>
            <p className="mt-2 text-sm text-slate-600">
            Please log in to view your profile and publications.
            </p>
          </section>
        </div>
      </main>
    );
  }

  // 3. Fetch posts safely using the ID embedded in the decoded token
  const myPosts = await getUserPosts(user.id);
  const displayName = user.username || user.email.split('@')[0];
  const totalReactions = myPosts.reduce((sum, post) => sum + post.reactions.length, 0);
  const totalComments = myPosts.reduce((sum, post) => sum + post.comments.length, 0);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 lg:grid-cols-[18.25rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 px-6 py-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:bg-white lg:px-8 lg:py-10">
          <nav className="flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-4 lg:overflow-visible lg:text-base">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-4 px-3 py-2 text-slate-600 transition-colors hover:text-slate-950 lg:px-0"
            >
              <span className="flex size-6 items-center justify-center">
                <span className="size-4 rotate-45 border-l border-t border-slate-500" />
              </span>
              Home
            </Link>
            <Link
              href="/"
              className="flex shrink-0 items-center gap-4 px-3 py-2 text-slate-600 transition-colors hover:text-slate-950 lg:px-0"
            >
              <span className="flex size-6 items-center justify-center">
                <span className="h-5 w-4 border border-slate-500" />
              </span>
              Library
            </Link>
            <Link
              href="/profile"
              className="relative flex shrink-0 items-center gap-4 px-3 py-2 font-medium text-slate-950 lg:px-0"
            >
              <span className="hidden lg:absolute lg:-left-8 lg:block lg:h-7 lg:w-px lg:bg-slate-950" />
              <span className="flex size-6 items-center justify-center">
                <span className="size-3 rounded-full bg-slate-950" />
              </span>
              Profile
            </Link>
            <Link
              href="/compose"
              className="flex shrink-0 items-center gap-4 px-3 py-2 text-slate-600 transition-colors hover:text-slate-950 lg:px-0"
            >
              <span className="flex size-6 items-center justify-center">
                <span className="h-5 w-4 border border-slate-500" />
              </span>
              Stories
            </Link>
            <Link
              href="/profile"
              className="flex shrink-0 items-center gap-4 px-3 py-2 text-slate-600 transition-colors hover:text-slate-950 lg:px-0"
            >
              <span className="flex size-6 items-end justify-center gap-0.5">
                <span className="h-2 w-1 border border-slate-500" />
                <span className="h-4 w-1 border border-slate-500" />
                <span className="h-3 w-1 border border-slate-500" />
              </span>
              Stats
            </Link>
          </nav>

          <div className="mt-8 hidden border-t border-slate-100 pt-8 lg:block">
            <h2 className="flex items-center gap-4 text-base font-normal text-slate-600">
              <span className="flex size-6 items-center justify-center">
                <span className="size-4 rounded-full border border-slate-500" />
              </span>
              Following
            </h2>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <span className="font-serif font-semibold text-slate-950">Ne</span>
              <span>Neup Staff</span>
              <span className="size-1.5 rounded-full bg-green-600" />
            </div>
            <p className="mt-8 max-w-[13rem] text-sm leading-6 text-slate-600">
              Find writers and publications to follow.
            </p>
            <Link href="/" className="mt-3 inline-block text-sm text-slate-600 underline">
              See suggestions
            </Link>
          </div>

          <div className="mt-8 hidden border-t border-slate-100 pt-8 lg:block">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-semibold text-slate-950">{myPosts.length}</p>
                <p className="mt-1 text-xs text-slate-500">Stories</p>
              </div>
              <div>
                <p className="font-semibold text-slate-950">{totalReactions}</p>
                <p className="mt-1 text-xs text-slate-500">Likes</p>
              </div>
              <div>
                <p className="font-semibold text-slate-950">{totalComments}</p>
                <p className="mt-1 text-xs text-slate-500">Replies</p>
              </div>
            </div>
          </div>

          <div className="mt-8 hidden border-t border-slate-100 pt-8 lg:block">
            <div className="space-y-3">
              <Link
                href="/compose"
                className="block border border-slate-950 bg-slate-950 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Write
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full cursor-pointer border border-red-500/30 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0 px-6 py-10 sm:px-10 lg:px-0 lg:pb-16 lg:pl-56 lg:pr-20 lg:pt-16">
          <div className="max-w-[52rem]">
            <header>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="break-words text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[52px] lg:leading-tight">
                    {displayName}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 lg:hidden">
                    {myPosts.length > 0
                      ? `Published ${myPosts.length} ${myPosts.length === 1 ? 'story' : 'stories'} with ${totalReactions} ${totalReactions === 1 ? 'reaction' : 'reactions'} and ${totalComments} ${totalComments === 1 ? 'comment' : 'comments'}.`
                      : 'No public stories yet. Start your first draft when you are ready to publish.'}
                  </p>
                </div>

                <form action="/api/auth/signout" method="POST" className="lg:hidden">
                  <button
                    type="submit"
                    className="cursor-pointer border border-red-500/30 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </form>
              </div>

              <div className="mt-12 flex gap-9 overflow-x-auto border-b border-slate-200 text-sm text-slate-500">
                <Link href="/profile" className="border-b border-slate-950 pb-4 font-medium text-slate-950">
                  Home
                </Link>
                <span className="pb-4">Reposts</span>
                <span className="pb-4">Activity</span>
                <span className="pb-4">Lists</span>
                <span className="pb-4">About</span>
              </div>
            </header>

            {myPosts.length === 0 ? (
              <section className="py-16">
                <div className="max-w-lg border border-dashed border-slate-300 bg-slate-50 p-8">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    Start your first story
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Your published drafts will appear here in a clean reading feed.
                  </p>
                  <Link
                    href="/compose"
                    className="mt-6 inline-block border border-slate-950 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    Write a story
                  </Link>
                </div>
              </section>
            ) : (
              <section className="divide-y divide-slate-200">
                {myPosts.map((post) => (
                  <article key={post.id} className="py-12">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white">
                        {getInitials(displayName)}
                      </div>
                      <span className="font-medium text-slate-700">{displayName}</span>
                      <span>-</span>
                      <span>{formatProfileDate(post.createdAt)}</span>
                    </div>

                    <div className="mt-5 grid gap-8 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
                      <div className="min-w-0">
                        <p className="break-words text-[28px] font-semibold leading-tight tracking-tight">
                          <Link
                            href={getArticlePath(post)}
                            className="text-slate-950 transition-colors hover:text-slate-700"
                          >
                            {post.title}
                          </Link>
                          <Link
                            href={getArticleEditPath(post)}
                            className="ml-4 font-medium text-slate-400 hover:underline"
                          >
                            Edit
                          </Link>
                        </p>
                        <p className="mt-3 line-clamp-2 text-xl leading-7 text-slate-500">
                          {getPostExcerpt(post.content)}
                        </p>
                      </div>

                      <Link
                        href={getArticlePath(post)}
                        aria-label={`Read ${post.title}`}
                        className="hidden aspect-[1.45/1] items-center justify-center rounded-sm bg-slate-100 text-3xl font-semibold text-slate-400 transition-colors hover:bg-slate-200 sm:flex"
                      >
                        {getInitials(post.title)}
                      </Link>
                    </div>

                    <div className="mt-7 flex items-center justify-between text-sm text-slate-500">
                      <div className="flex gap-5">
                        <span>{post.reactions.length} reactions</span>
                        <span>{post.comments.length} comments</span>
                      </div>
                      <Link
                        href={getArticlePath(post)}
                        className="font-medium text-slate-700 transition-colors hover:text-slate-950"
                      >
                        Read
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
