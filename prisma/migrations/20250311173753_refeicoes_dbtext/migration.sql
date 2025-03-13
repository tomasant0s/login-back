/*
  Warnings:

  - You are about to alter the column `processedAt` on the `pagamentos` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `dietas` MODIFY `cafeManha` TEXT NOT NULL,
    MODIFY `lancheManha` TEXT NOT NULL,
    MODIFY `almoco` TEXT NOT NULL,
    MODIFY `lancheTarde` TEXT NOT NULL,
    MODIFY `janta` TEXT NOT NULL,
    MODIFY `treino` TEXT NULL;

-- AlterTable
ALTER TABLE `pagamentos` MODIFY `processedAt` DATETIME NOT NULL;
