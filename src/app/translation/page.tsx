import { cookies } from 'next/headers';
import { verifyTokenWithBridge } from '@/lib/bridge-auth.service';
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
      <main className="p-8 text-center text-red-500 font-medium">
        Please login to access translation tools.
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Translation Tools</h1>
      <p className="text-sm text-green-600 mb-6">✓ Authenticated as: {user.username}</p>
      
      {/* Injecting our generic, interactive client widget */}
      <TranslationWidget />
    </main>
  );
}