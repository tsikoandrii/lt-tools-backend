-- CreateTable
CREATE TABLE "public"."CommentTask" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "facebookAccountId" INTEGER NOT NULL,
    "postId" TEXT NOT NULL,
    "knownCommentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastCheckedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CommentTask" ADD CONSTRAINT "CommentTask_facebookAccountId_fkey" FOREIGN KEY ("facebookAccountId") REFERENCES "public"."FacebookAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentTask" ADD CONSTRAINT "CommentTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
