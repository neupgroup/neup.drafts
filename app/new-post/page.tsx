import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import NewPostForm from '@/components/NewPostForm';

export default async function NewPostPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifyTokenWithBridge(token) : null;

  if (!user) {
    redirect('/unauthorized');
  }

  const displayName = user.username || user.email.split('@')[0];

  return (
    <main className="max-w-xl mx-auto p-6 mt-12 bg-white border rounded-xl shadow-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create a New Article</h1>
        <p className="text-xs text-gray-500 mt-1">
          Publishing publicly as <span className="font-semibold text-gray-700">@{displayName}</span>
        </p>
      </div>
      
      <hr className="border-gray-100" />
      
      {/* Clean component call with no unused props */}
      <NewPostForm />
    </main>
  );
}