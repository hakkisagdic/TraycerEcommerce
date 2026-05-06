import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@blog.com")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: "Admin",
      role: "admin",
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: "admin",
    },
  });

  console.log(`Seeded admin user: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
