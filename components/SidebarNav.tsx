/*
::neup.documentation::sidebar-nav-component
::title Sidebar Nav Component

Renders the shared left sidebar navigation treatment used by profile and manage pages.

::public

Use `SidebarNav` when a page needs the same rounded nav-item treatment, icon rail, and optional sign-out action as the manage workspace.

::public end

::end
*/

import Link from 'next/link';

type SidebarNavIcon =
  | 'articles'
  | 'compose'
  | 'home'
  | 'library'
  | 'overview'
  | 'profile'
  | 'signout'
  | 'stats';

interface SidebarNavItem {
  active?: boolean;
  href: string;
  icon: SidebarNavIcon;
  label: string;
}

interface SidebarNavProps {
  sections: Array<{
    items: SidebarNavItem[];
    title: string;
  }>;
  signOutLabel?: string;
}

function SidebarNavIconGlyph({ kind }: { kind: SidebarNavIcon }) {
  const className = 'h-5 w-5';

  if (kind === 'overview' || kind === 'home') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13V10.5" />
        <path d="M10 20v-5.5h4V20" />
      </svg>
    );
  }

  if (kind === 'articles' || kind === 'library') {
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

  if (kind === 'profile') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M19 20a7 7 0 0 0-14 0" />
        <circle cx="12" cy="8" r="4" />
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

export default function SidebarNav({
  sections,
  signOutLabel = 'Sign Out',
}: SidebarNavProps) {
  return (
    <>
      <nav className="flex gap-4 overflow-x-auto text-sm lg:block lg:overflow-visible lg:text-base">
        {sections.map((section, index) => (
          <div key={section.title} className={index === 0 ? '' : 'mt-7'}>
            <div className="mb-3 px-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {section.title}
              </p>
            </div>

            <div className="flex gap-1 overflow-x-auto lg:block lg:space-y-2.5 lg:overflow-visible">
              {section.items.map((item) => (
                <Link
                  key={`${item.href}:${item.label}`}
                  href={item.href}
                  className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 transition-all duration-200 lg:px-3 ${
                    item.active
                      ? 'bg-sky-100 font-semibold text-sky-700 shadow-[inset_0_0_0_1px_rgba(125,168,201,0.18)] hover:bg-sky-200 hover:text-sky-800'
                      : 'text-slate-800 hover:bg-sky-50 hover:text-sky-700'
                  }`}
                >
                  <span className="flex size-6 items-center justify-center">
                    <SidebarNavIconGlyph kind={item.icon} />
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <form action="/api/auth/signout" method="POST" className="mt-6 border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 lg:px-3"
          >
            <span className="flex size-6 items-center justify-center">
              <SidebarNavIconGlyph kind="signout" />
            </span>
            {signOutLabel}
          </button>
        </form>
      </nav>
    </>
  );
}
