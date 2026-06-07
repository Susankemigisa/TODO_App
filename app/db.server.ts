import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __db__: PrismaClient | undefined;
}

let db: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  db = new PrismaClient({ adapter });
} else {
  if (!global.__db__) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    global.__db__ = new PrismaClient({ adapter });
  }
  db = global.__db__;
}

export { db };