import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTokenWithBridge } from '@/lib/bridge-auth.service';
import NewPostForm from '@/components/NewPostForm';

export default async function NewPostPage() {
  // 1. Protect the page on the server side
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifyTokenWithBridge(token) : null;

  if (!user) {
    redirect('/unauthorized'); // Send away if not logged in
  }

  return (
    <main className="max-w-xl mx-auto p-6 mt-12 bg-white border rounded-xl shadow-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create a New Article</h1>
        <p className="text-xs text-gray-400 mt-1">
          Publishing publicly as <span className="font-semibold text-gray-600">@{user.username}</span>
        </p>
      </div>
      
      <hr className="border-gray-100" />
      
      {/* Hand off execution to an interactive client form component */}
      <NewPostForm />
    </main>
  );
}