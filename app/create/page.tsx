import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import NewPostForm from '@/components/NewPostForm';

export default async function CreatePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifyTokenWithBridge(token) : null;

  if (!user) {
    redirect('/unauthorized');
  }

  const displayName = user.username || user.email.split('@')[0];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 shadow-md shadow-slate-200/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-[22px] font-bold tracking-tighter text-slate-950 transition-colors hover:text-blue-600"
          >
            Neup.Drafts
          </Link>
          <Link
            href="/account"
            className="border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            @{displayName}
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-2xl space-y-8 px-6 py-10">
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
