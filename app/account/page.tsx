import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { prisma } from '@/inapp/lib/prisma'; 
import { Prisma } from '@/app/generated/prisma/client';

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
  console.log("Decoded user object from token:", user);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-slate-900">
        <section className="max-w-md border border-slate-200 bg-slate-50 p-8">
          <p className="font-medium text-red-600">Access Denied.</p>
          <p className="mt-2 text-sm text-slate-600">
          Please log in to view your profile and publications.
          </p>
        </section>
      </main>
    );
  }

  // 3. Fetch posts safely using the ID embedded in the decoded token
  const myPosts = await getUserPosts(user.id);

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-4xl space-y-8">
      {/* USER PROFILE CARD */}
      <div className="flex flex-col gap-6 border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-blue-600">
            Account
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-slate-950">User Profile</h1>
          <div className="mt-5 space-y-2 text-sm text-slate-700">
            <p><strong>Display Name:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
            <p className="break-all text-xs text-slate-500"><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>

        {/* SIGN OUT BUTTON */}
        <form action="/api/auth/signout" method="POST">
          <button 
            type="submit" 
            className="h-10 cursor-pointer border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* USER PUBLICATIONS SECTION */}
      <div className="border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-5 text-xl font-medium tracking-tight text-slate-950">
          Your Publications ({myPosts.length})
        </h2>

        {myPosts.length === 0 ? (
          <p className="text-sm italic text-slate-500">
            {"You haven't published any articles yet."}
          </p>
        ) : (
          <div className="divide-y divide-slate-200">
            {myPosts.map((post) => (
              <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                <Link href={getArticlePath(post)} className="block font-medium text-slate-950 transition-colors hover:text-blue-600">
                  {post.title}
                </Link>
                <div className="mt-2 flex gap-4 font-mono text-xs text-slate-500">
                  <span>{post.reactions.length} reactions</span>
                  <span>{post.comments.length} comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </section>
    </main>
  );
}
