'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      // 1. Refresh router to ensure Server Components pick up the auth cookie
      router.refresh();
      
      // 2. Redirect straight to the account page
      router.push('/account');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#131710] p-6 text-[#e2e8f0]">
      <div className="w-full max-w-md space-y-6 border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-white">Sign In</h1>
          <p className="mt-1 text-sm text-[#c1bddb]/80">
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <div className="border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#58fcec]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full border border-[#a2c7e5]/20 bg-[#131710] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#a2c7e5]/35 focus:border-[#58fcec]/70"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#58fcec]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-11 w-full border border-[#a2c7e5]/20 bg-[#131710] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#a2c7e5]/35 focus:border-[#58fcec]/70"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-[#58fcec] text-sm font-black text-[#131710] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
