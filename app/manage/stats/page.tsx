/*
::neup.documentation::manage-stats-page
::title Manage Stats Page

Provides a protected engagement summary view for the authenticated user's managed articles.

::public

Use `/manage/stats` to review totals, averages, and top-performing articles across the current user's published drafts.

::public end

::end
*/

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import HeaderV1S1 from "@/components/header.v1s1";
import ManageShell from "@/components/ManageShell";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import { getManagedArticlePosts } from "@/services/articles/articles";

type ManagedArticle = Awaited<
  ReturnType<typeof getManagedArticlePosts>
>[number];

function getManagedArticlePath(post: ManagedArticle): string {
  return `/manage/articles/${post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`}`;
}

function formatRatio(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

export default async function ManageStatsPage() {
  const cookieStore = await cookies();

  const authAccountToken = cookieStore.get("auth_account")?.value ?? null;

  const authResult = await bridgeAuth.checkAuthentication(authAccountToken);

  if (!authResult.authenticated) {
    redirect("/unauthorized");
  }

  const user = await bridgeAuth.getCurrentAccount(authAccountToken);

  if (!user) {
    redirect("/unauthorized");
  }

  const posts = await getManagedArticlePosts(user.id);
  const totalReactions = posts.reduce(
    (sum, post) => sum + post.reactions.length,
    0,
  );
  const totalComments = posts.reduce(
    (sum, post) => sum + post.comments.length,
    0,
  );
  const averageReactions = posts.length > 0 ? totalReactions / posts.length : 0;
  const averageComments = posts.length > 0 ? totalComments / posts.length : 0;
  const topReactionPosts = [...posts]
    .sort((left, right) => right.reactions.length - left.reactions.length)
    .slice(0, 5);
  const topCommentPosts = [...posts]
    .sort((left, right) => right.comments.length - left.comments.length)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <ManageShell
        activeSection="stats"
        ctaHref="/manage/articles"
        ctaLabel="Open articles"
        description="Review aggregate engagement and identify the drafts drawing the most reactions and replies."
        metrics={[
          { label: "Avg reactions", value: formatRatio(averageReactions) },
          { label: "Avg comments", value: formatRatio(averageComments) },
          { label: "Total posts", value: posts.length },
        ]}
        title="Stats"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="border border-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Top by reactions
              </h2>
            </div>

            {topReactionPosts.length === 0 ? (
              <div className="px-5 py-5 text-sm text-slate-500">
                No articles available.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {topReactionPosts.map((post, index) => (
                  <article
                    key={post.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Rank {index + 1}
                      </p>
                      <Link
                        href={getManagedArticlePath(post)}
                        className="mt-1 block truncate font-semibold text-slate-950 transition-colors hover:text-blue-600"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <span className="font-mono text-slate-700">
                      {post.reactions.length}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="border border-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Top by comments
              </h2>
            </div>

            {topCommentPosts.length === 0 ? (
              <div className="px-5 py-5 text-sm text-slate-500">
                No articles available.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {topCommentPosts.map((post, index) => (
                  <article
                    key={post.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Rank {index + 1}
                      </p>
                      <Link
                        href={getManagedArticlePath(post)}
                        className="mt-1 block truncate font-semibold text-slate-950 transition-colors hover:text-blue-600"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <span className="font-mono text-slate-700">
                      {post.comments.length}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </ManageShell>
    </main>
  );
}
