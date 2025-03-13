/*
  Warnings:

  - You are about to alter the column `processedAt` on the `pagamentos` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `imc` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - Added the required column `horarios` to the `dietas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dietas` ADD COLUMN `horarios` VARCHAR(191) NOT NULL,
    ADD COLUMN `treino` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `pagamentos` MODIFY `processedAt` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `imc` DOUBLE NULL;
