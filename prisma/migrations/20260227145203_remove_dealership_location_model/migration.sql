/*
  Warnings:

  - You are about to drop the `DealershipLocation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DealershipLocation" DROP CONSTRAINT "DealershipLocation_organizationId_fkey";

-- DropTable
DROP TABLE "DealershipLocation";
