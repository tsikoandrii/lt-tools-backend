-- CreateEnum
CREATE TYPE "public"."CommentAction" AS ENUM ('DELETE', 'HIDE', 'TRACK');

-- AlterTable
ALTER TABLE "public"."CommentTask" ADD COLUMN     "action" "public"."CommentAction" NOT NULL DEFAULT 'TRACK',
ADD COLUMN     "notification" BOOLEAN NOT NULL DEFAULT false;
