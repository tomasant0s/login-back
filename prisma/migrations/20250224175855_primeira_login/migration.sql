-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `telefone` CHAR(14) NOT NULL,
    `tickets` INTEGER NOT NULL,
    `ticketsUsados` INTEGER NULL,
    `hashSenha` VARCHAR(150) NOT NULL,
    `prompt` VARCHAR(100) NULL,
    `altura` VARCHAR(4) NULL,
    `peso` VARCHAR(3) NULL,
    `imc` INTEGER NULL,
    `lastLogin` DATE NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dietas` (
    `id` CHAR(36) NOT NULL,
    `cafeManha` VARCHAR(191) NOT NULL,
    `lancheManha` VARCHAR(191) NOT NULL,
    `almoco` VARCHAR(191) NOT NULL,
    `lancheTarde` VARCHAR(191) NOT NULL,
    `janta` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,

    UNIQUE INDEX `dietas_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos` (
    `id` CHAR(36) NOT NULL,
    `processedAt` DATETIME NOT NULL,
    `status` VARCHAR(15) NOT NULL,
    `userId` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dietas` ADD CONSTRAINT `dietas_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
