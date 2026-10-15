import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <section className="w-full max-w-xl text-center">
          <p className="font-mono text-sm font-semibold tracking-[0.25em] text-blue-600">
            ERROR 404
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            This page wandered off.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
            The link may be outdated, or the page may have moved. Let’s get you
            back to something worth reading.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Back to the feed
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Search articles
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
