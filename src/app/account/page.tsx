import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/lib/bridge-auth.service';

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // Native Server-side Auth verification
  const user = token ? await verifyTokenWithBridge(token) : null;

  // 🚀 2. ADD THIS LINE IMMEDIATELY BELOW IT TO OVERRIDE IT, temporary (for testing)
// const user = { 
//   username: "Prototype Tester", 
//   role: "clerk",
//   id: 123
// };

  if (!user) {
    return (
      <main className="p-8 max-w-md mx-auto text-center">
        <p className="text-red-500 font-medium">Access Denied.</p>
        <p className="text-sm text-gray-500 mt-1">Please visit your callback route with a token to log in.</p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-md mx-auto border rounded-xl shadow-sm mt-12 bg-white">
      <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <p><strong>Username:</strong> @{user.username}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>ID:</strong> {user.id}</p>
      </div>
    </main>
  );
}