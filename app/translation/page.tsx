import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
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
      <main className="flex min-h-screen items-center justify-center bg-[#131710] p-6 text-center text-red-300">
        <p className="border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold">
          Please login to access translation tools.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#131710] px-6 py-10 text-[#e2e8f0]">
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="border-b border-[#a2c7e5]/10 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#58fcec]">
            Translation
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Translation Tools</h1>
          <p className="mt-2 text-sm text-[#c1bddb]/80">
            Authenticated as <span className="font-bold text-white">@{user.username}</span>
          </p>
        </div>

        <TranslationWidget />
      </section>
    </main>
  );
}
