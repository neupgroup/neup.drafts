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
    <main className="min-h-screen bg-white px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-2xl space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-blue-600">
            New Publication
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-slate-950">Create an Article</h1>
          <p className="mt-2 text-sm text-slate-600">
            Publishing publicly as <span className="font-medium text-slate-950">@{displayName}</span>
          </p>
        </div>

        <div className="border border-slate-200 bg-slate-50 p-6">
          <NewPostForm />
        </div>
      </section>
    </main>
  );
}
