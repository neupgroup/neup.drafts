import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist_Mono, Outfit } from "next/font/google";
import HeaderV1S1 from "@/components/header.v1s1";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neup.Drafts",
  description: "Write and publish drafts with Neup.Drafts.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authAccountToken = cookieStore.get("auth_account")?.value ?? null;
  const user = await bridgeAuth.getCurrentAccount(authAccountToken);

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={`${outfit.className} flex min-h-full flex-col bg-white text-slate-900`}
      >
        <HeaderV1S1 user={user} />
        {children}
      </body>
    </html>
  );
}
