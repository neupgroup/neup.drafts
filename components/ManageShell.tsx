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

interface ManageSidebarSummary {
  comments: number;
  displayName: string;
  posts: number;
  reactions: number;
}

interface ManageShellProps {
  activeSection: 'overview' | 'articles' | 'stats';
  children: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  description: string;
  eyebrow?: string;
  metrics?: ManageMetric[];
  sidebarSummary: ManageSidebarSummary;
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

export default function ManageShell({
  activeSection,
  children,
  ctaHref,
  ctaLabel,
  description,
  eyebrow = 'Manage',
  metrics = [],
  sidebarSummary,
  title,
}: ManageShellProps) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 lg:grid-cols-[18.25rem_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 px-6 py-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:bg-white lg:px-8 lg:py-10">
        <nav className="flex gap-2 overflow-x-auto text-sm lg:block lg:space-y-4 lg:overflow-visible lg:text-base">
          {manageSections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className={`relative flex shrink-0 items-center gap-4 px-3 py-2 transition-colors lg:px-0 ${
                activeSection === section.id
                  ? 'font-medium text-slate-950'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {activeSection === section.id ? (
                <span className="hidden lg:absolute lg:-left-8 lg:block lg:h-7 lg:w-px lg:bg-slate-950" />
              ) : null}
              <span className="flex size-6 items-center justify-center">
                {section.id === 'overview' ? (
                  <span className={`size-3 rounded-full ${activeSection === section.id ? 'bg-slate-950' : 'bg-slate-300'}`} />
                ) : null}
                {section.id === 'articles' ? (
                  <span className={`h-5 w-4 border ${activeSection === section.id ? 'border-slate-950' : 'border-slate-500'}`} />
                ) : null}
                {section.id === 'stats' ? (
                  <span className="flex items-end justify-center gap-0.5">
                    <span className={`h-2 w-1 border ${activeSection === section.id ? 'border-slate-950' : 'border-slate-500'}`} />
                    <span className={`h-4 w-1 border ${activeSection === section.id ? 'border-slate-950' : 'border-slate-500'}`} />
                    <span className={`h-3 w-1 border ${activeSection === section.id ? 'border-slate-950' : 'border-slate-500'}`} />
                  </span>
                ) : null}
              </span>
              {section.label}
            </Link>
          ))}

          <Link
            href="/compose"
            className="flex shrink-0 items-center gap-4 px-3 py-2 text-slate-600 transition-colors hover:text-slate-950 lg:px-0"
          >
            <span className="flex size-6 items-center justify-center">
              <span className="size-4 rotate-45 border-l border-t border-slate-500" />
            </span>
            New Post
          </Link>
        </nav>

        <div className="mt-8 hidden border-t border-slate-100 pt-8 lg:block">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-semibold text-slate-950">{sidebarSummary.posts}</p>
              <p className="mt-1 text-xs text-slate-500">Posts</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">{sidebarSummary.reactions}</p>
              <p className="mt-1 text-xs text-slate-500">Likes</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">{sidebarSummary.comments}</p>
              <p className="mt-1 text-xs text-slate-500">Replies</p>
            </div>
          </div>
        </div>

        <div className="mt-8 hidden border-t border-slate-100 pt-8 lg:block">
          <p className="text-sm leading-6 text-slate-600">
            Management workspace for @{sidebarSummary.displayName}. Open article inventory, inspect engagement, and jump back into editing.
          </p>
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
