/*
  Warnings:

  - You are about to drop the column `ultramsgInstanceId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ultramsgToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "ultramsgInstanceId",
DROP COLUMN "ultramsgToken";
