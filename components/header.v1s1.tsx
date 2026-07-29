'use client';

import Link from 'next/link';
import { useState } from 'react';

interface HeaderV1S1Props {
  user: {
    displayImage?: string | null;
    name?: string | null;
    displayName?: string | null;
    neupId?: string | null;
  } | null;
}

export default function HeaderV1S1({ user }: HeaderV1S1Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userName = user
    ? user.name || user.displayName || user.neupId || 'User'
    : '';
  const neupId = user?.neupId || 'user';
  const userInitial = userName.charAt(0).toUpperCase();
  const navLinkClassName =
    'rounded-xl px-4 py-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950';
  const mobileNavLinkClassName =
    'block rounded-2xl bg-slate-50 px-4 py-4 text-base font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950';

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-md shadow-slate-200/80">
      <div className="relative mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-950 transition-colors hover:text-blue-600 sm:text-xl"
          onClick={() => setIsMenuOpen(false)}
        >
          Neup.Drafts
        </Link>

        {user ? (
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 text-[15px] font-medium md:flex">
            <Link href="/compose" className={navLinkClassName}>
              Create Post
            </Link>
            <Link href="/translation" className={navLinkClassName}>
              Translate
            </Link>
            <Link href="/manage" className={navLinkClassName}>
              Manage
            </Link>
          </div>
        ) : null}

        <div className="flex items-center gap-3 text-[15px] font-medium">
          {user ? (
            <>
              <Link
                href="/profile"
                className="hidden items-center gap-3 rounded-full pl-2 pr-1.5 py-1 text-slate-950 transition-all hover:bg-slate-100 md:flex"
              >
                <div className="flex min-w-0 flex-col items-end leading-none">
                  <span className="max-w-[11rem] truncate text-[14px] font-medium text-slate-950">
                    {userName}
                  </span>
                  <span className="max-w-[11rem] truncate pt-0.5 text-[13px] font-medium text-slate-400">
                    @{neupId}
                  </span>
                </div>
                {user?.displayImage ? (
                  <img
                    src={user.displayImage}
                    alt={userName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[13px] font-semibold text-white">
                    {userInitial}
                  </div>
                )}
              </Link>
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-100 md:hidden"
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                <span className="flex w-4 flex-col gap-1.5">
                  <span
                    className={`block h-0.5 w-full bg-current transition-transform duration-200 ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
                  />
                  <span
                    className={`block h-0.5 w-full bg-current transition-opacity duration-200 ${isMenuOpen ? 'opacity-0' : ''}`}
                  />
                  <span
                    className={`block h-0.5 w-full bg-current transition-transform duration-200 ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
                  />
                </span>
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="bg-blue-600 px-4 py-1.5 text-[14px] font-medium text-white transition-all hover:bg-opacity-90 sm:text-[15px]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="border border-slate-300 px-4 py-1.5 text-[14px] font-medium text-slate-950 transition-all hover:bg-slate-100 sm:text-[15px]"
              >
                Sign Up
              </Link>
            </div>
          )}
          {!user ? (
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-100 md:hidden"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="flex w-4 flex-col gap-1.5">
                <span
                  className={`block h-0.5 w-full bg-current transition-transform duration-200 ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
                />
                <span
                  className={`block h-0.5 w-full bg-current transition-opacity duration-200 ${isMenuOpen ? 'opacity-0' : ''}`}
                />
                <span
                  className={`block h-0.5 w-full bg-current transition-transform duration-200 ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
                />
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-slate-200 bg-white px-6 py-6 md:hidden">
          <div className="flex min-h-[calc(100vh-4rem)] flex-col">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-4 border-b border-slate-200 pb-6"
                onClick={() => setIsMenuOpen(false)}
              >
                {user?.displayImage ? (
                  <img
                    src={user.displayImage}
                    alt={userName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white">
                    {userInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-slate-950">{userName}</p>
                  <p className="truncate pt-1 text-sm font-medium text-slate-400">@{neupId}</p>
                </div>
              </Link>
            ) : null}

            <div className="space-y-2 pt-6">
              {user ? (
                <>
                  <Link href="/compose" className={mobileNavLinkClassName} onClick={() => setIsMenuOpen(false)}>
                    Create Post
                  </Link>
                  <Link href="/translation" className={mobileNavLinkClassName} onClick={() => setIsMenuOpen(false)}>
                    Translate
                  </Link>
                  <Link href="/manage" className={mobileNavLinkClassName} onClick={() => setIsMenuOpen(false)}>
                    Manage
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block rounded-2xl bg-blue-600 px-4 py-4 text-base font-medium text-white transition-all hover:bg-blue-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base font-medium text-slate-950 transition-all hover:bg-slate-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
