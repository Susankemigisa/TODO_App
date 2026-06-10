import pkg from "@prisma/client";
const { PrismaClient } = pkg;

declare global {
  var __prisma: InstanceType<typeof PrismaClient> | undefined;
}

function getClient() {
  return new PrismaClient();
}

export const db = getClient();