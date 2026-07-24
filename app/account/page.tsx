import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { prisma } from '@/inapp/lib/prisma'; 
import { Prisma } from '@/app/generated/prisma/client';

// Extract the exact return type for Article + included relations
type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: { comments: true; reactions: true };
}>;

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
      <main className="flex min-h-screen items-center justify-center bg-[#131710] p-6 text-center text-[#e2e8f0]">
        <section className="max-w-md border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-8">
          <p className="font-bold text-red-300">Access Denied.</p>
          <p className="mt-2 text-sm text-[#c1bddb]/80">
          Please log in to view your profile and publications.
          </p>
        </section>
      </main>
    );
  }

  // 3. Fetch posts safely using the ID embedded in the decoded token
  const myPosts = await getUserPosts(user.id);

  return (
    <main className="min-h-screen bg-[#131710] px-6 py-10 text-[#e2e8f0]">
      <section className="mx-auto max-w-4xl space-y-8">
      {/* USER PROFILE CARD */}
      <div className="flex flex-col gap-6 border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#58fcec]">
            Account
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">User Profile</h1>
          <div className="mt-5 space-y-2 text-sm text-[#d8d5e8]">
            <p><strong>Display Name:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
            <p className="break-all text-xs text-[#a2c7e5]/60"><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>

        {/* SIGN OUT BUTTON */}
        <form action="/api/auth/signout" method="POST">
          <button 
            type="submit" 
            className="h-10 cursor-pointer border border-red-500/30 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* USER PUBLICATIONS SECTION */}
      <div className="border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-6">
        <h2 className="mb-5 text-xl font-black tracking-tight text-white">
          Your Publications ({myPosts.length})
        </h2>

        {myPosts.length === 0 ? (
          <p className="text-sm italic text-[#a2c7e5]/60">
            {"You haven't published any articles yet."}
          </p>
        ) : (
          <div className="divide-y divide-[#a2c7e5]/10">
            {myPosts.map((post) => (
              <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                <h3 className="cursor-pointer font-bold text-white transition-colors hover:text-[#58fcec]">
                  {post.title}
                </h3>
                <div className="mt-2 flex gap-4 font-mono text-xs text-[#a2c7e5]/70">
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
