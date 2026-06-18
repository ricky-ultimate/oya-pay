/*
  Warnings:

  - You are about to drop the column `projectId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "projectId";

-- DropTable
DROP TABLE "Project";

-- DropEnum
DROP TYPE "ProjectStatus";
