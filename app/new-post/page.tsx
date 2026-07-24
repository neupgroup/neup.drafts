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
    <main className="min-h-screen bg-[#131710] px-6 py-10 text-[#e2e8f0]">
      <section className="mx-auto max-w-2xl space-y-8">
        <div className="border-b border-[#a2c7e5]/10 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#58fcec]">
            New Publication
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Create an Article</h1>
          <p className="mt-2 text-sm text-[#c1bddb]/80">
            Publishing publicly as <span className="font-bold text-white">@{displayName}</span>
          </p>
        </div>

        <div className="border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-6">
          <NewPostForm />
        </div>
      </section>
    </main>
  );
}
