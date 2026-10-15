import { getBaseUrl } from "@neup/logica/baseurl";

export function getAuthStartUrl(authenticatesTo: string): string {
  const url = new URL("/account/auth/start", getBaseUrl("neupid"));
  url.searchParams.set("authenticatesTo", authenticatesTo);

  return url.toString();
}

export function getAuthStartUrlForPath(path: string): string {
  const target = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3723",
  );
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(
    /^\/+|\/+$/g,
    "",
  );
  const routePath = path.replace(/^\/+/, "");

  target.pathname = [basePath, routePath].filter(Boolean).join("/");
  target.pathname = `/${target.pathname}`;

  return getAuthStartUrl(target.toString());
}

// export function getClientAuthStartUrl(): string {
//   // 1. If in browser, use the live window origin (captures 3000, 3723, etc. automatically)
//   // 2. If on server, fall back to your .env variable
//   const origin =
//     typeof window !== "undefined"
//       ? window.location.origin
//       : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3723";

//   return getAuthStartUrl(origin);
// }

export function getClientAuthStartUrl(currentUrl?: string): string {
  const target =
    currentUrl ||
    (typeof window !== "undefined"
      ? window.location.href
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3723");

  return getAuthStartUrl(target);
}
