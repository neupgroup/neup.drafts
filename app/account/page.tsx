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
      <main className="p-8 max-w-md mx-auto text-center mt-12">
        <p className="text-red-500 font-medium">Access Denied.</p>
        <p className="text-sm text-gray-500 mt-1">
          Please log in to view your profile and publications.
        </p>
      </main>
    );
  }

  // 3. Fetch posts safely using the ID embedded in the decoded token
  const myPosts = await getUserPosts(user.id);

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6 mt-12">
      {/* USER PROFILE CARD */}
      <div className="p-6 border rounded-xl shadow-sm bg-white flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p><strong>Display Name:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
            <p className="text-xs text-gray-400"><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>

        {/* SIGN OUT BUTTON */}
        <form action="/api/auth/signout" method="POST">
          <button 
            type="submit" 
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* USER PUBLICATIONS SECTION */}
      <div className="p-6 border rounded-xl shadow-sm bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Your Publications ({myPosts.length})
        </h2>

        {myPosts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            {"You haven't published any articles yet."}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {myPosts.map((post) => (
              <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                <h3 className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer">
                  {post.title}
                </h3>
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span>👍 {post.reactions.length} reactions</span>
                  <span>💬 {post.comments.length} comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}