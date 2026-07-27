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
import SidebarNav from './SidebarNav';

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
  active: boolean;
  href: string;
  icon: 'overview' | 'articles' | 'stats' | 'compose';
  label: string;
}> = [
  { active: false, href: '/manage', icon: 'overview', label: 'Overview' },
  { active: false, href: '/manage/articles', icon: 'articles', label: 'Articles' },
  { active: false, href: '/manage/stats', icon: 'stats', label: 'Stats' },
];

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
        <SidebarNav
          sections={[
            {
              title: 'Profile',
              items: [
                { href: '/', icon: 'home', label: 'Home' },
                { href: '/', icon: 'library', label: 'Library' },
                { href: '/profile', icon: 'profile', label: 'Profile' },
                { href: '/compose', icon: 'compose', label: 'New Story' },
              ],
            },
            {
              title: 'Manage',
              items: manageSections.map((section) => ({
                ...section,
                active:
                  (section.icon === 'overview' && activeSection === 'overview') ||
                  (section.icon === 'articles' && activeSection === 'articles') ||
                  (section.icon === 'stats' && activeSection === 'stats'),
              })),
            },
          ]}
        />
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
