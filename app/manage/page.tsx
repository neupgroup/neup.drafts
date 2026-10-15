/*
::neup.documentation::manage-overview-page
::title Manage Overview Page

Provides a protected overview dashboard for the authenticated user's article management area.

::public

Use `/manage` to review article volume, engagement totals, and shortcuts into article inventory and stats.

::public end

::end
*/

import { cookies } from "next/headers";
import { LinkButton } from "@neup/components/ui/link-button";
import { redirect } from "next/navigation";
import ManageShell from "@/components/ManageShell";
import { getAuthStartUrlForPath } from "@/inapp/lib/auth-redirect";
import { ensureAccount } from "@neup/shared/account/self";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import { getManagedArticlePosts } from "@/services/articles/articles";

type ManagedArticle = Awaited<
  ReturnType<typeof getManagedArticlePosts>
>[number];

function getManagedArticlePath(post: ManagedArticle): string {
  return `/manage/articles/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
}

function getArticleEditPath(post: ManagedArticle): string {
  return `/compose?article=${encodeURIComponent(post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`)}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getPostExcerpt(content: string): string {
  const normalizedContent = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalizedContent.length <= 140) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 137)}...`;
}

export default async function ManageOverviewPage() {
  const cookieStore = await cookies();

  const authAccountToken = cookieStore.get("auth_account")?.value ?? null;

  const account = await ensureAccount(authAccountToken);
  const accountId = account?.id ?? await bridgeAuth.getAccountId(authAccountToken);

  if (!accountId) {
    redirect(getAuthStartUrlForPath("/manage"));
  }

  const posts = await getManagedArticlePosts(accountId);
  const totalReactions = posts.reduce(
    (sum, post) => sum + post.reactions.length,
    0,
  );
  const totalComments = posts.reduce(
    (sum, post) => sum + post.comments.length,
    0,
  );
  const recentPosts = posts.slice(0, 5);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white text-slate-900">
      <ManageShell
        activeSection="overview"
        ctaHref="/compose"
        ctaLabel="New post"
        description="Track your article workspace, jump into editing, and review current engagement at a glance."
        metrics={[
          { label: "Posts", value: posts.length },
          { label: "Reactions", value: totalReactions },
          { label: "Comments", value: totalComments },
        ]}
        title="Overview"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <section className="border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Recent articles
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest updates across your published drafts.
                </p>
              </div>
              <LinkButton variant="text" size="sm"
                href="/manage/articles"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
              >
                All articles
              </LinkButton>
            </div>

            {recentPosts.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">
                No published drafts yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {recentPosts.map((post) => (
                  <article key={post.id} className="px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <LinkButton variant="text" size="sm"
                          href={getManagedArticlePath(post)}
                          className="block truncate text-lg font-semibold text-slate-950 transition-colors hover:text-blue-600"
                        >
                          {post.title}
                        </LinkButton>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                          {getPostExcerpt(post.content) || "No body content."}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {formatDate(post.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span>{post.reactions.length} reactions</span>
                      <span>{post.comments.length} comments</span>
                      <LinkButton variant="text" size="sm"
                        href={getArticleEditPath(post)}
                        className="font-medium text-blue-600 transition-colors hover:text-blue-800"
                      >
                        Edit
                      </LinkButton>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">
                Inventory
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Inspect every article row with direct links into edit and public
                view flows.
              </p>
              <LinkButton variant="text" size="sm"
                href="/manage/articles"
                className="mt-4 inline-flex text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
              >
                Open article inventory
              </LinkButton>
            </section>

            <section className="border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Stats</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Compare engagement concentration, top-performing posts, and
                response averages.
              </p>
              <LinkButton variant="text" size="sm"
                href="/manage/stats"
                className="mt-4 inline-flex text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
              >
                Open stats
              </LinkButton>
            </section>
          </div>
        </div>
      </ManageShell>
    </main>
  );
}
