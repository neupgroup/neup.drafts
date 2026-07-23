'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      // Refresh router so Server Components detect the new auth token
      router.refresh();

      // Redirect straight to account page
      router.push('/account');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during sign up.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#131710] text-[#e2e8f0] p-6">
      <div className="max-w-md w-full bg-[#a2c7e5]/5 border border-[#a2c7e5]/15 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create an Account</h1>
          <p className="text-sm text-[#c1bddb]/80">
            Join to manage your articles, comments, and profile
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#58fcec] uppercase mb-1 tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              className="w-full px-3 py-2 bg-[#131710] border border-[#a2c7e5]/20 text-white rounded-lg text-sm focus:outline-none focus:border-[#58fcec] transition-colors placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#58fcec] uppercase mb-1 tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-[#131710] border border-[#a2c7e5]/20 text-white rounded-lg text-sm focus:outline-none focus:border-[#58fcec] transition-colors placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#58fcec] uppercase mb-1 tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#131710] border border-[#a2c7e5]/20 text-white rounded-lg text-sm focus:outline-none focus:border-[#58fcec] transition-colors placeholder:text-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#58fcec] hover:bg-opacity-90 text-[#131710] font-bold rounded-lg text-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-[#a2c7e5]/70 pt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-[#58fcec] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}