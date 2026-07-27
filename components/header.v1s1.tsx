import Link from 'next/link';

interface HeaderV1S1Props {
  user: {
    username?: string | null;
    email?: string | null;
  } | null;
}

export default function HeaderV1S1({ user }: HeaderV1S1Props) {
  const userDisplayName = user
    ? user.username || user.email?.split('@')[0] || 'user'
    : '';

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-md shadow-slate-200/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link
          href="/"
          className="text-[22px] font-bold tracking-tighter text-slate-950 transition-colors hover:text-blue-600"
        >
          Neup.Drafts
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <>
              <Link href="/compose" className="text-slate-600 transition-colors hover:text-blue-600">
                Create Post
              </Link>
              <Link href="/translation" className="text-slate-600 transition-colors hover:text-blue-600">
                Translate
              </Link>
              <Link href="/manage" className="text-slate-600 transition-colors hover:text-blue-600">
                Manage
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-1.5 text-slate-950 transition-all hover:bg-slate-100"
              >
                @{userDisplayName}
              </Link>

              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="cursor-pointer border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-500/20 hover:text-red-700"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="bg-blue-600 px-4 py-1.5 font-medium text-white transition-all hover:bg-opacity-90"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="border border-slate-300 px-4 py-1.5 font-medium text-slate-950 transition-all hover:bg-slate-100"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
