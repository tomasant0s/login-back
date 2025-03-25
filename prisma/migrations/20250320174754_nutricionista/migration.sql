/*
  Warnings:

  - You are about to alter the column `processedAt` on the `pagamentos` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `pagamentos` MODIFY `processedAt` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `nutricionistaPersonalizado` INTEGER NULL;
