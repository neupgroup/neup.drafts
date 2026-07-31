import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { prisma } from '@/inapp/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client';
import HeaderV1S1 from '@/components/header.v1s1';

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: { comments: true; reactions: true; author: true };
}>;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[];
    sort?: string | string[];
  }>;
}

function getArticlePath(post: ArticleWithRelations): string {
  if (!post.slug) {
    return `/article/${post.id}`;
  }
  return `/article/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
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
  if (parts.length === 0) return 'U';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function getPostExcerpt(content: string): string {
  const normalizedContent = content.replace(/\s+/g, ' ').trim();
  if (normalizedContent.length <= 160) return normalizedContent;
  return `${normalizedContent.slice(0, 157)}...`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // Verify user optional auth for the header (guests will have user = null)
  const user = token ? await verifyTokenWithBridge(token) : null;

  const queryParams = await searchParams;
  const queryParam = Array.isArray(queryParams.q) ? queryParams.q[0] : queryParams.q || '';
  const sortParam = Array.isArray(queryParams.sort) ? queryParams.sort[0] : queryParams.sort || 'latest';

  let searchResults: ArticleWithRelations[] = [];
  
  // Only query the database if the user has actually typed something in the search bar
  const hasSearched = queryParam.trim().length > 0;

  if (hasSearched) {
    try {
      searchResults = await prisma.article.findMany({
        where: {
          OR: [
            { title: { contains: queryParam, mode: 'insensitive' } },
            { content: { contains: queryParam, mode: 'insensitive' } },
          ],
        },
        include: {
          comments: true,
          reactions: true,
          author: true,
        },
        orderBy: {
          createdAt: sortParam === 'oldest' ? 'asc' : 'desc',
        },
      });
    } catch (error) {
      console.error('Failed fetching search results:', error);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <section className="mx-auto max-w-[1200px] px-6 py-10 sm:px-10 lg:px-12">
        
        {/* Search Bar Section (Centered) */}
        <div className="flex flex-col items-center mb-16">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl mb-6">
            Search Articles
          </h1>
          <form method="GET" action="/search" className="w-full max-w-2xl relative">
            <input
              type="text"
              name="q"
              defaultValue={queryParam}
              placeholder="Search by keyword, title, or content..."
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent text-base transition-all"
            />
            <input type="hidden" name="sort" value={sortParam} />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-950 hover:bg-slate-800 text-white p-3 rounded-full transition-colors shadow-sm"
              aria-label="Search"
            >
              <svg 
                className="size-4 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="2.5" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" 
                />
              </svg>
            </button>
          </form>
        </div>

        {/* Main Grid: Filters on Left, Results on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-10">
          
          {/* Left Sidebar: Filters */}
          <aside className="h-fit border border-slate-200 bg-slate-50 p-6 rounded-lg">
            <h2 className="font-semibold text-slate-950 mb-4 pb-2 border-b border-slate-200">
              Filters
            </h2>
            <form method="GET" action="/search" className="space-y-4">
              <input type="hidden" name="q" value={queryParam} />
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-slate-600 mb-2">
                  Sort By
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sortParam}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <button
                  type="submit"
                  className="mt-3 w-full bg-slate-950 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </aside>

          {/* Right Section: Results Count & Article Feed */}
          <section className="min-w-0">
            
            {/* Status Header */}
            <div className="border-b border-slate-200 pb-4 mb-6">
              <p className="text-sm font-medium text-slate-600">
                {!hasSearched ? (
                  <span>Type a keyword above to start searching articles.</span>
                ) : searchResults.length > 0 ? (
                  <span>
                    Found <strong className="text-slate-950">{searchResults.length}</strong> result{searchResults.length === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">No result found</span>
                )}
              </p>
            </div>

            {/* Articles List / Empty State */}
            {!hasSearched ? (
              <div className="border border-slate-200 bg-slate-50 p-12 text-center rounded-lg">
                <h3 className="text-lg font-semibold text-slate-950 mb-2">Ready to explore?</h3>
                <p className="text-sm text-slate-600">Enter a topic or title in the search bar above to look through stories.</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-lg font-semibold text-slate-950 mb-2">No matching stories found</h3>
                <p className="text-sm text-slate-600">Try searching for alternative keywords or phrases.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {searchResults.map((post) => {
                  const authorName = post.author?.username || 'Anonymous';
                  return (
                    <article key={post.id} className="py-8">
                      <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white">
                          {getInitials(authorName)}
                        </div>
                        <span className="font-medium text-slate-700">{authorName}</span>
                        <span>-</span>
                        <span>{formatProfileDate(post.createdAt)}</span>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-start">
                        <div className="min-w-0">
                          <h2 className="text-2xl font-semibold tracking-tight leading-tight mb-2">
                            <Link href={getArticlePath(post)} className="text-slate-950 hover:text-slate-700 transition-colors">
                              {post.title}
                            </Link>
                          </h2>
                          <p className="line-clamp-2 text-base text-slate-600 leading-relaxed">
                            {getPostExcerpt(post.content)}
                          </p>
                        </div>

                        <Link
                          href={getArticlePath(post)}
                          aria-label={`Read ${post.title}`}
                          className="hidden aspect-[1.45/1] items-center justify-center rounded bg-slate-100 text-2xl font-semibold text-slate-400 transition-colors hover:bg-slate-200 sm:flex"
                        >
                          {getInitials(post.title)}
                        </Link>
                      </div>

                      <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                        <div className="flex gap-4">
                          <span>{post.reactions.length} reactions</span>
                          <span>{post.comments.length} comments</span>
                        </div>
                        <Link href={getArticlePath(post)} className="font-medium text-slate-700 hover:text-slate-950">
                          Read
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          </section>
        </div>

      </section>
    </main>
  );
}