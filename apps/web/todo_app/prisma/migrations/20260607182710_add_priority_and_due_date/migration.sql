-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';
