import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";

import HeaderV1S1 from "@/components/header.v1s1";
import ManageShell from "@/components/ManageShell";

import { PERMISSIONS } from "@/inapp/lib/permissions";

export default async function AccessPage() {
  const cookieStore = await cookies();
  const authAccountToken = cookieStore.get("auth_account")?.value ?? null;

  const authResult = await bridgeAuth.checkAuthentication(authAccountToken);

  if (!authResult.authenticated) {
    redirect("/account/auth/start");
  }

  const accountId = await bridgeAuth.getAccountId(authAccountToken);

  if (!accountId) {
    redirect("/account/auth/start");
  }

  const user = await bridgeAuth.getCurrentAccount(authAccountToken);

  if (!user) {
    redirect("/account/auth/start");
  }

  const authorized = await bridgeAuth.checkAuthorization(
    accountId,
    PERMISSIONS.ACCESS_MANAGE,
  );

  if (!authorized) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={null} />

        <ManageShell
          activeSection="access"
          ctaHref="/manage"
          ctaLabel="Back to overview"
          description="View the access and permissions associated with your account."
          metrics={[{ label: "Status", value: "Restricted" }]}
          title="Access"
        >
          <section className="border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Access denied
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your account does not have permission to view access information.
            </p>
          </section>
        </ManageShell>
      </main>
    );
  }

  const result = await bridgeAuth.getAccountAccess(accountId);

  if (!result || !result.ok || !result.body.success) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={user} />

        <ManageShell
          activeSection="access"
          ctaHref="/manage"
          ctaLabel="Back to overview"
          description="View the access and permissions associated with your account."
          metrics={[{ label: "Status", value: "Unavailable" }]}
          title="Access"
        >
          <section className="border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Unable to load access
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {result?.body.error ??
                "Something went wrong while loading access information."}
            </p>
          </section>
        </ManageShell>
      </main>
    );
  }

  const accessEntries = result.body.access;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HeaderV1S1 user={user} />

      <ManageShell
        activeSection="access"
        ctaHref="/manage"
        ctaLabel="Back to overview"
        description="Review the permissions and access currently associated with your Central Auth account."
        metrics={[
          {
            label: "Access entries",
            value: accessEntries.length,
          },
          {
            label: "Account",
            value: accountId.slice(0, 8),
          },
        ]}
        title="Access"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <section className="border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Permissions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Access information returned by Central Auth.
                </p>
              </div>

              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                {accessEntries.length} entries
              </span>
            </div>

            {accessEntries.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">
                No access permissions were found for this account.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {accessEntries.map((entry, index) => (
                  <article key={index} className="px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-950">
                          Access entry {index + 1}
                        </p>

                        <pre className="mt-3 overflow-x-auto border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                          {JSON.stringify(entry, null, 2)}
                        </pre>
                      </div>

                      <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Central Auth
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Account</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page is scoped to the currently authenticated Central Auth
                account.
              </p>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Account ID
                </p>

                <p className="mt-2 break-all font-mono text-sm text-slate-700">
                  {accountId}
                </p>
              </div>
            </section>

            <section className="border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">
                Central Auth
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Access information is loaded through the Central Auth account
                access service.
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700">Connected</span>
              </div>
            </section>
          </div>
        </div>
      </ManageShell>
    </main>
  );
}
