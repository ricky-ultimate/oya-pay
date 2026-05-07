/*
  Warnings:

  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paystackSubaccountActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paystackSubaccountCode" TEXT,
ADD COLUMN     "ultramsgInstanceId" TEXT,
ADD COLUMN     "ultramsgToken" TEXT,
ALTER COLUMN "phone" SET NOT NULL;
