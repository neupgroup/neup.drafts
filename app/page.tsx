import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';

// Post interface matching the real DB structure and fallback types
interface Author {
  id: string;
  username?: string | null;
  email?: string;
  role?: string;
}

interface Post {
  id: string;
  title: string;
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

async function getAllPosts(): Promise<Post[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifyTokenWithBridge(token) : null;

  // Only fetch articles if the user is authenticated
  const posts = user ? await getAllPosts() : [];

  // User display name fallback (username or email prefix)
  const userDisplayName = user
    ? user.username || user.email.split('@')[0]
    : '';

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-200 selection:text-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-200 sticky top-0 z-50 bg-white/90 shadow-md shadow-slate-200/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-[22px] font-bold tracking-tighter text-slate-950 hover:text-blue-600 transition-colors">
            Neup.Drafts
          </Link>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <Link href="/new-post" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Create Post
                </Link>
                <Link href="/translation" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Translate
                </Link>
                <Link href="/account" className="flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-950 transition-all hover:bg-slate-100">
                  @{userDisplayName}
                </Link>

                {/* SIGN OUT BUTTON */}
                <form action="/api/auth/signout" method="POST">
                  <button 
                    type="submit" 
                    className="cursor-pointer border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-500/20 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="bg-blue-600 px-4 py-1.5 font-medium text-white transition-all hover:bg-opacity-90"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="border border-slate-300 px-4 py-1.5 font-medium text-slate-950 transition-all hover:bg-slate-100"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Feed Column */}
        <section className="space-y-10">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xs uppercase font-medium tracking-widest text-blue-600">
              {user ? 'Recent Publications' : 'Sign In'}
            </h2>
          </div>

          {!user ? (
            /* Inline Direct Sign-In Card for Unauthenticated Visitors */
            <div className="max-w-md space-y-6 border border-slate-200 bg-slate-50 p-8">
              <div>
                <h3 className="text-2xl font-medium text-slate-950">Welcome Back</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Please log in to access publications and join discussions.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-blue-600 py-3 text-center font-medium text-white transition-all hover:bg-opacity-90"
                >
                  Go to Login Page
                </Link>
                
                <p className="text-center text-xs text-slate-500 pt-2">
                  {"Don't have an account yet?"}{' '}
                  <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-slate-500 italic py-8">No articles found in the database.</p>
          ) : (
            <div className="space-y-12">
              {posts.map((post) => {
                const authorName =
                  typeof post.author === 'object' && post.author !== null
                    ? post.author.username || post.author.email?.split('@')[0]
                    : post.author || 'Anonymous';

                const likesCount =
                  post.likes ??
                  post._count?.reactions ??
                  post.reactions?.length ??
                  0;

                const commentsCount =
                  post._count?.comments ??
                  post.comments?.length ??
                  0;

                return (
                  <article key={post.id} className="group relative space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                      <span>@{authorName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">ID #{post.id.slice(-6)}</span>
                    </div>

                    <Link href={`/article/${post.id}`} className="block group-hover:text-slate-700">
                      <h3 className="text-3xl font-medium tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors duration-200">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                      {post.content}
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
                        href={`/article/${post.id}`} 
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

      </div>
    </main>
  );
}
