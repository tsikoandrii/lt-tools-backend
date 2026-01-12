/*
  Warnings:

  - Changed the type of `adAccountId` on the `CommentTask` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CommentTask" DROP COLUMN "adAccountId",
ADD COLUMN     "adAccountId" INTEGER NOT NULL;
