import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import HeaderV1S1 from '@/components/header.v1s1';
import TranslationWidget from '@/components/TranslationWidget';

// Define the shape of the user object returned by your mock auth
interface BridgeUser {
  username: string;
  id: string;
  email?: string;
}

export default async function TranslationPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // Trigger your mock auth check on the server
  const user: BridgeUser | null = token ? await verifyTokenWithBridge(token) : null;

  // Security Gatekeeper: Block users who aren't logged in
  if (!user) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={null} />

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 text-center text-red-600">
          <p className="border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium">
            Please login to access translation tools.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <section className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-blue-600">
            Translation
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-slate-950">Translation Tools</h1>
          <p className="mt-2 text-sm text-slate-600">
            Authenticated as <span className="font-medium text-slate-950">@{user.username}</span>
          </p>
        </div>

        <TranslationWidget />
      </section>
    </main>
  );
}
