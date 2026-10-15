-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "account" (
    "id" VARCHAR(255) NOT NULL,
    "neupId" VARCHAR(255),
    "connectionId" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "displayImage" VARCHAR(255),
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "moreDetails" JSONB,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_authors" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "article_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authz_access" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "article_id" TEXT,
    "project_id" TEXT,
    "role_id" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "authz_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authz_role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB,
    "synced_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authz_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" VARCHAR(255) NOT NULL,
    "member_id" VARCHAR(255) NOT NULL,
    "account_id" VARCHAR(255),
    "connection_id" VARCHAR(255),
    "asset_id" VARCHAR(255),
    "asset_type" VARCHAR(255),
    "asset_id_denorm" VARCHAR(255),
    "role_id" VARCHAR(255) NOT NULL,
    "role_name" VARCHAR(255),
    "permissions" JSONB,
    "status" VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    "details" JSONB,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access" (
    "id" VARCHAR(255) NOT NULL,
    "access_type" VARCHAR(255) NOT NULL,
    "member_account_id" VARCHAR(255),
    "parent_account_id" VARCHAR(255),
    "is_temporary" TIMESTAMP(3),
    "role_id" VARCHAR(255) NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_neupId_key" ON "account"("neupId");
CREATE UNIQUE INDEX "account_connectionId_key" ON "account"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "role_member_id_idx" ON "role"("member_id");

-- CreateIndex
CREATE INDEX "role_account_id_idx" ON "role"("account_id");

-- CreateIndex
CREATE INDEX "role_connection_id_idx" ON "role"("connection_id");

-- CreateIndex
CREATE INDEX "role_asset_id_idx" ON "role"("asset_id");

-- CreateIndex
CREATE INDEX "role_role_id_idx" ON "role"("role_id");

-- CreateIndex
CREATE INDEX "access_member_account_id_idx" ON "access"("member_account_id");

-- CreateIndex
CREATE INDEX "access_parent_account_id_idx" ON "access"("parent_account_id");

-- CreateIndex
CREATE INDEX "access_role_id_idx" ON "access"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_accountId_articleId_type_key" ON "Reaction"("accountId", "articleId", "type");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authz_access" ADD CONSTRAINT "authz_access_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authz_access" ADD CONSTRAINT "authz_access_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "authz_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access" ADD CONSTRAINT "access_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "authz_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
