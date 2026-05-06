import { prisma } from "../lib/prisma";

async function main() {
  // Seed logic will be added in T2 after the data model is finalized in T3.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
