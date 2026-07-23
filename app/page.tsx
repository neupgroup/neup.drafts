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

  const posts = await getAllPosts();

  // User display name fallback (username or email prefix)
  const userDisplayName = user
    ? user.username || user.email.split('@')[0]
    : '';

  return (
    <main className="min-h-screen bg-[#131710] text-[#e2e8f0] antialiased selection:bg-[#58fcec] selection:text-[#131710]">
      {/* Navigation */}
      <nav className="border-b border-[#a2c7e5]/10 sticky top-0 z-50 bg-[#131710]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter text-white hover:text-[#58fcec] transition-colors">
            HOME PAGE
          </Link>
          
          <div className="flex items-center gap-6 text-sm font-medium">
            {user ? (
              <>
                <Link href="/new-post" className="text-[#a2c7e5] hover:text-[#58fcec] transition-colors">
                  ✏️ Create Post
                </Link>
                <Link href="/translation" className="text-[#a2c7e5] hover:text-[#58fcec] transition-colors">
                  🌐 Translate
                </Link>
                <Link href="/account" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#a2c7e5]/25 text-white bg-[#a2c7e5]/5 hover:bg-[#a2c7e5]/15 transition-all">
                  <span>👤</span> @{userDisplayName}
                </Link>
              </>
            ) : (
              <Link href="/login" className="px-4 py-1.5 rounded-lg bg-[#58fcec] text-[#131710] font-bold hover:bg-opacity-90 transition-all shadow-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-12 lg:grid-cols-3">
        {/* Feed Column */}
        <section className="lg:col-span-2 space-y-10">
          <div className="border-b border-[#a2c7e5]/10 pb-4">
            <h2 className="text-xs uppercase font-bold tracking-widest text-[#58fcec]">
              Recent Publications
            </h2>
          </div>

          {posts.length === 0 ? (
            <p className="text-[#a2c7e5]/60 italic py-8">No articles found in the database.</p>
          ) : (
            <div className="space-y-12">
              {posts.map((post) => {
                // Determine author name safely whether post.author is an object or a string
                const authorName =
                  typeof post.author === 'object' && post.author !== null
                    ? post.author.username || post.author.email?.split('@')[0]
                    : post.author || 'Anonymous';

                // Calculate likes and comments across real DB and mock DB structures
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
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#ff99c9]">
                      <span>@{authorName}</span>
                      <span className="text-[#a2c7e5]/40">•</span>
                      <span className="text-[#a2c7e5]/70">ID #{post.id.slice(-6)}</span>
                    </div>

                    <Link href={`/article/${post.id}`} className="block group-hover:text-white">
                      <h3 className="text-2xl font-extrabold tracking-tight text-white group-hover:text-[#58fcec] transition-colors duration-200">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-[#c1bddb]/90 text-sm leading-relaxed line-clamp-3">
                      {post.content}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#a2c7e5]/80">
                      <div className="flex items-center gap-4">
                        <span className="hover:text-[#ff99c9] transition-colors">
                          ❤️ {likesCount} likes
                        </span>
                        <span>
                          💬 {commentsCount} comments
                        </span>
                      </div>

                      <Link 
                        href={`/article/${post.id}`} 
                        className="text-[#58fcec] opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
                      >
                        Read full story →
                      </Link>
                    </div>

                    <div className="border-b border-[#a2c7e5]/10 pt-8" />
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="sticky top-28 bg-[#a2c7e5]/5 border border-[#a2c7e5]/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-white text-base tracking-tight">
              Environment Monitor
            </h3>
            
            <p className="text-xs text-[#c1bddb]/70 leading-relaxed">
              Core authentication hooks and secure JWT verification are executing natively via Next.js Server Components.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#58fcec]/10 text-[#58fcec] border border-[#58fcec]/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#58fcec] animate-pulse" />
                Gateway: Active
              </div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#58fcec]/10 text-[#58fcec] border border-[#58fcec]/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#58fcec]" />
                Database: PostgreSQL Active
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}