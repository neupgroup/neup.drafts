/*
::neup.documentation::manage-shell-component
::title Manage Shell Component

Renders the shared management workspace chrome for article and stats routes.

::public

Use `ManageShell` to keep navigation, title treatment, and optional summary cards consistent across `/manage` pages.

::public end

::end
*/

import Link from 'next/link';
import type { ReactNode } from 'react';

interface ManageMetric {
  label: string;
  value: string | number;
}

interface ManageShellProps {
  activeSection: 'overview' | 'articles' | 'stats';
  children: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  description: string;
  eyebrow?: string;
  metrics?: ManageMetric[];
  title: string;
}

const manageSections: Array<{
  id: ManageShellProps['activeSection'];
  href: string;
  label: string;
}> = [
  { id: 'overview', href: '/manage', label: 'Overview' },
  { id: 'articles', href: '/manage/articles', label: 'Articles' },
  { id: 'stats', href: '/manage/stats', label: 'Stats' },
];

function ManageSidebarIcon({
  kind,
}: {
  kind: 'overview' | 'articles' | 'stats' | 'compose' | 'signout';
}) {
  const className = 'h-5 w-5';

  if (kind === 'overview') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13V10.5" />
        <path d="M10 20v-5.5h4V20" />
      </svg>
    );
  }

  if (kind === 'articles') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  if (kind === 'stats') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M5 19V11" />
        <path d="M12 19V5" />
        <path d="M19 19v-8" />
      </svg>
    );
  }

  if (kind === 'compose') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 6H5v13h14V6h-4" />
      <path d="M12 3v10" />
      <path d="m8.5 9.5 3.5 3.5 3.5-3.5" />
    </svg>
  );
}

export default function ManageShell({
  activeSection,
  children,
  ctaHref,
  ctaLabel,
  description,
  eyebrow = 'Manage',
  metrics = [],
  title,
}: ManageShellProps) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 lg:grid-cols-[18.25rem_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 px-6 py-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:bg-white lg:px-6 lg:py-10">
        <div className="mb-6 px-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Manage
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto text-sm lg:block lg:space-y-2.5 lg:overflow-visible lg:text-base">
          {manageSections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 transition-all duration-200 lg:px-3 ${
                activeSection === section.id
                  ? 'bg-sky-100 font-semibold text-sky-700 shadow-[inset_0_0_0_1px_rgba(125,168,201,0.18)] hover:bg-sky-150 hover:text-sky-800'
                  : 'text-slate-800 hover:bg-sky-50 hover:text-sky-700'
              }`}
            >
              <span className="flex size-6 items-center justify-center">
                <ManageSidebarIcon kind={section.id} />
              </span>
              {section.label}
            </Link>
          ))}

          <Link
            href="/compose"
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-slate-800 transition-all duration-200 hover:bg-sky-50 hover:text-sky-700 lg:px-3"
          >
            <span className="flex size-6 items-center justify-center">
              <ManageSidebarIcon kind="compose" />
            </span>
            New Post
          </Link>
        </nav>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 lg:px-3"
            >
              <span className="flex size-6 items-center justify-center">
                <ManageSidebarIcon kind="signout" />
              </span>
              Sign Out
            </button>
          </form>
        </div>

      </aside>

      <div className="min-w-0 px-6 py-10 sm:px-10 lg:px-0 lg:pb-16 lg:pl-20 lg:pr-20 lg:pt-16">
        <div className="max-w-[60rem]">
          <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>

            {ctaHref && ctaLabel ? (
              <Link
                href={ctaHref}
                className="inline-flex h-10 items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                {ctaLabel}
              </Link>
            ) : null}
          </div>

          {metrics.length > 0 ? (
            <div className="mt-8 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="bg-white p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
