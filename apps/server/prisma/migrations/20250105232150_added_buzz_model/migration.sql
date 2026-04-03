-- CreateTable
CREATE TABLE "Buzz" (
    "id" TEXT NOT NULL,
    "current" TEXT NOT NULL,
    "imageURL" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buzz_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Buzz" ADD CONSTRAINT "Buzz_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
