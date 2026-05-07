import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@blog.com")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
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

  // Add test post
  const contentJson = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "yes ok oldu bu metin otomatik eklendi!",
          },
        ],
      },
    ],
  };

  const post = await prisma.post.upsert({
    where: { slug: "deneme-mcp" },
    update: {},
    create: {
      title: "Deneme MCP",
      slug: "deneme-mcp",
      contentJson: JSON.stringify(contentJson),
      contentText: "yes ok oldu bu metin otomatik eklendi!",
      excerpt: "Deneme MCP post'u",
      status: "published",
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  console.log(`Seeded post: ${post.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
