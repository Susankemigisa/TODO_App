import pkg from "@prisma/client";
const { PrismaClient } = pkg;

declare global {
  var __prisma: InstanceType<typeof PrismaClient> | undefined;
}

function getClient() {
  if (process.env.NODE_ENV === "production") {
    return new PrismaClient();
  }
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  return global.__prisma;
}

export const db = getClient();