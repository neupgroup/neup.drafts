import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  //basepath
  basePath:'/drafts',

  // 2. Prevent Next.js from bundling Prisma binaries natively
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
};

export default nextConfig;
