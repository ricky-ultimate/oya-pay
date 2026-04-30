-- AlterTable
ALTER TABLE "FollowUpLog" ADD COLUMN     "template" "FollowUpTemplate";

-- CreateTable
CREATE TABLE "EmailOpen" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOpen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayLinkClick" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayLinkClick_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailOpen" ADD CONSTRAINT "EmailOpen_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayLinkClick" ADD CONSTRAINT "PayLinkClick_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
