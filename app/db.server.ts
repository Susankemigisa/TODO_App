import pkg from "@prisma/client";
const { PrismaClient } = pkg;

declare global {
  var __prisma: InstanceType<typeof PrismaClient> | undefined;
}

function getClient() {
  const client = new PrismaClient();
  return client;
}

export const db = getClient();