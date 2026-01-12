/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `CommentTask` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `adAccountId` to the `CommentTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommentTask" ADD COLUMN     "adAccountId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CommentTask_postId_key" ON "CommentTask"("postId");
