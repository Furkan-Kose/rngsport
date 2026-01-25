/*
  Warnings:

  - Added the required column `customerEmail` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customerEmail" TEXT;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "customerEmail" TEXT NOT NULL;
