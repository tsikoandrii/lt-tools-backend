-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPERADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."ProxyStatus" AS ENUM ('ACTIVE', 'DEAD');

-- CreateEnum
CREATE TYPE "public"."FbAccountStatus" AS ENUM ('ACTIVE', 'CHECKPOINT', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."AdAccountStatus" AS ENUM ('ACTIVE', 'GRACE', 'CLOSED', 'BLOCKED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FacebookAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fbUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" "public"."FbAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacebookAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdAccount" (
    "id" SERIAL NOT NULL,
    "facebookAccountId" INTEGER NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessId" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "country" TEXT,
    "status" "public"."AdAccountStatus" NOT NULL,
    "hasCard" BOOLEAN NOT NULL,
    "hasPixel" BOOLEAN NOT NULL,
    "notifications" BOOLEAN NOT NULL DEFAULT false,
    "autoCommenting" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proxy" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "status" "public"."ProxyStatus" NOT NULL DEFAULT 'ACTIVE',
    "facebookAccountId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FacebookAccount_fbUserId_key" ON "public"."FacebookAccount"("fbUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdAccount_adAccountId_key" ON "public"."AdAccount"("adAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Proxy_facebookAccountId_key" ON "public"."Proxy"("facebookAccountId");

-- AddForeignKey
ALTER TABLE "public"."FacebookAccount" ADD CONSTRAINT "FacebookAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdAccount" ADD CONSTRAINT "AdAccount_facebookAccountId_fkey" FOREIGN KEY ("facebookAccountId") REFERENCES "public"."FacebookAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proxy" ADD CONSTRAINT "Proxy_facebookAccountId_fkey" FOREIGN KEY ("facebookAccountId") REFERENCES "public"."FacebookAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
