import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { getArticleFeed } from '@/services/articles/articles';
import HeaderV1S1 from '@/components/header.v1s1';

interface Author {
  id: string;
  displayName?: string | null;
  neupId?: string | null;
  status?: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  author?: Author | string;
  likes?: number;
  reactions?: Array<unknown>;
  comments?: Array<unknown>;
  _count?: {
    comments?: number;
    reactions?: number;
  };
}

function getArticlePath(post: Post): string {
  if (!post.slug) {
    return `/article/${post.id}`;
  }
  return `/article/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

async function getAllPosts(): Promise<Post[]> {
  try {
    return await getArticleFeed();
  } catch (error) {
    console.error("Failed to load posts:", error);
    return [];
  }
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifyTokenWithBridge(token) : null;

  // Always fetch published articles for everyone (both guests and logged-in users)
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-200 selection:text-slate-950">
      <HeaderV1S1 user={user} />

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-12 items-start">
          
          {/* Left Column: Public Feed of All Published Articles */}
          <section className="space-y-10 min-w-0">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <h2 className="text-xs uppercase font-medium tracking-widest text-blue-600">
                Recent Publications
              </h2>
              <Link
                href="/search"
                className="text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors"
              >
                Search Articles &rarr;
              </Link>
            </div>

            {posts.length === 0 ? (
              <p className="text-slate-500 italic py-8">No articles found in the database.</p>
            ) : (
            <div className="space-y-12">
            {posts.map((post) => {
              const authorName =
              typeof post.author === 'object' && post.author !== null
              ? post.author.neupId || post.author.displayName || 'Anonymous'
              : post.author || 'Anonymous';

                const likesCount =
                  post._count?.reactions ??
                  post.reactions?.length ??
                  post.likes ??
                  0;

                const commentsCount =
                  post._count?.comments ??
                  post.comments?.length ??
                  0;

                  return (
                    <article key={post.id} className="group relative space-y-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                        <span>@{authorName}</span>
                        {/* <span className="text-slate-400">•</span>
                        <span className="text-slate-500">ID #{post.id.slice(-6)}</span> */}
                      </div>

                      <Link href={user? getArticlePath(post) : `/login?redirect=${encodeURIComponent(getArticlePath(post))}`} className="block group-hover:text-slate-700">
                        <h3 className="text-3xl font-medium tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors duration-200">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        {stripHtml(post.content)}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-600">
                        <div className="flex items-center gap-4">
                          <span className="hover:text-rose-600 transition-colors">
                            {likesCount} likes
                          </span>
                          <span>
                            {commentsCount} comments
                          </span>
                        </div>

                        <Link 
                          href={user ? getArticlePath(post) : `/login?redirect=${encodeURIComponent(getArticlePath(post))}`} 
                          className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                        >
                          Read full story
                        </Link>
                      </div>

                      <div className="border-b border-slate-200 pt-8" />
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Sidebar: Dynamic Card Based on Authentication Status */}
          <aside className="sticky top-24 space-y-6">
            {!user ? (
              /* Sign-In Card for Logged-Out Visitors */
              <div className="border border-slate-200 bg-slate-50 p-6 rounded-lg space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-slate-950">Welcome to Publications</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Log in to publish your own stories, leave reactions, and join discussions.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <Link
                    href="/login"
                    className="block w-full bg-blue-600 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-opacity-90 rounded"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full border border-slate-300 py-2.5 text-center text-sm font-medium text-slate-900 bg-white transition-all hover:bg-slate-50 rounded"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            ) : (
              /* Quick Profile/Welcome Card for Logged-In Users */
              <div className="border border-slate-200 bg-slate-50 p-6 rounded-lg space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-950">Hello, {user.displayName || user.neupId || 'Writer'}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Ready to share your next idea with the community?
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/compose"
                    className="block w-full bg-blue-600 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-opacity-90 rounded"
                  >
                    Write a Story
                  </Link>
                </div>
              </div>
            )}
          </aside>

        </div>
      </div>
    </main>
  );
}