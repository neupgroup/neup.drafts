import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/lib/bridge-auth.service';
// Import globalBlogPosts directly
import { Post, globalBlogPosts } from '@/lib/mock-db'; 

// 1. Query the data layer DIRECTLY (No localhost fetch!)
async function getUserPosts(username: string): Promise<Post[]> {
  try {
    // Filter the array directly in memory
    const userPosts = globalBlogPosts.filter((post: Post) => post.author === username);
    
    console.log(`➡️ Data Layer Connected! Found ${userPosts.length} posts for @${username}`);
    return userPosts;
  } catch (error) {
    console.error("Failed loading user publications:", error);
    return [];
  }
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // Native Server-side Auth verification
  const user = token ? await verifyTokenWithBridge(token) : null;

  if (!user) {
    return (
      <main className="p-8 max-w-md mx-auto text-center">
        <p className="text-red-500 font-medium">Access Denied.</p>
        <p className="text-sm text-gray-500 mt-1">Please visit your callback route with a token to log in.</p>
      </main>
    );
  }

  // 2. Fetch the user's posts securely on the server using verified credentials
  const myPosts = await getUserPosts(user.username);

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6 mt-12">
      {/* USER PROFILE CARD */}
      <div className="p-6 border rounded-xl shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p><strong>Username:</strong> @{user.username}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>ID:</strong> {user.id}</p>
        </div>
      </div>

      {/* USER PUBLICATIONS SECTION */}
      <div className="p-6 border rounded-xl shadow-sm bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Your Publications ({myPosts.length})
        </h2>

        {myPosts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{"You haven't published any articles yet."}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {myPosts.map((post) => (
              <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                <h3 className="font-semibold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">
                  {post.title}
                </h3>
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span>👍 {post.likes} likes</span>
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