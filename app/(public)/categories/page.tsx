import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "../../../lib/prisma";

export const metadata: Metadata = {
  title: "Kategoriler",
  description: "Tüm yazı kategorilerini keşfedin.",
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: { where: { status: "published" } },
        },
      },
    },
  });

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kategoriler</h1>
        <p className="mt-2 text-zinc-300">
          İlgilendiğiniz konuya göre yazıları keşfedin.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-zinc-400 py-6">Henüz kategori yok.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((c) => (
            <li
              key={c.id}
              className="border border-zinc-800 rounded p-4 hover:border-zinc-600"
            >
              <Link href={`/categories/${c.slug}`} className="block">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {c.name}
                  </h2>
                  <span className="text-xs text-zinc-400">
                    {c._count.posts} yazı
                  </span>
                </div>
                {c.description ? (
                  <p className="mt-2 text-sm text-zinc-400">{c.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
