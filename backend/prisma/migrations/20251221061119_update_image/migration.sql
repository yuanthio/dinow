/*
  Warnings:

  - You are about to drop the column `image` on the `Card` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;
