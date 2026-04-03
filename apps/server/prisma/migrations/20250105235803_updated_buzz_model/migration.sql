/*
  Warnings:

  - You are about to drop the column `current` on the `Buzz` table. All the data in the column will be lost.
  - Added the required column `content` to the `Buzz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Buzz" DROP COLUMN "current",
ADD COLUMN     "content" TEXT NOT NULL;
