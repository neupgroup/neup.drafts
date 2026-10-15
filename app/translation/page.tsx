import { cookies } from "next/headers";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import TranslationWidget from "@/components/TranslationWidget";

// Define the shape of the user object returned by your mock auth
export default async function TranslationPage() {
  const cookieStore = await cookies();

  const authAccountToken = cookieStore.get("auth_account")?.value ?? null;

  const authResult = await bridgeAuth.checkAuthentication(authAccountToken);

  if (!authResult.authenticated) {
    // keep your existing unauthorized handling
  }

  const accountId = await bridgeAuth.getAccountId(authAccountToken);

  // Security Gatekeeper: Block users who aren't logged in
  if (!accountId) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-white text-slate-900">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 text-center text-red-600">
          <p className="border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium">
            Please login to access translation tools.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white text-slate-900">
      <section className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-blue-600">
            Translation
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-slate-950">
            Translation Tools
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Translate text between supported languages.
          </p>
        </div>

        <TranslationWidget />
      </section>
    </main>
  );
}
