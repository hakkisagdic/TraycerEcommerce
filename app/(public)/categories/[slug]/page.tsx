import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "../../../../lib/prisma";
import PostPreview from "../../../../components/public/PostPreview";
import Pagination from "../../../../components/public/Pagination";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const category = await prisma.category.findUnique({ where: { slug: p.slug } });
  if (!category) {
    return { title: "Kategori bulunamadı" };
  }
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;
  const category = await prisma.category.findUnique({ where: { slug: p.slug } });
  if (!category) {
    notFound();
  }

  const page = Math.max(1, Number(sp?.page ?? 1));
  const limit = Math.min(20, Math.max(1, Number(sp?.limit ?? 10)));

  const where = { categoryId: category.id, status: "published" };

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { author: { select: { id: true, name: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="py-8">
      <div className="mb-6">
        <div className="text-sm text-zinc-400">Kategori</div>
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 text-zinc-300">{category.description}</p>
        ) : null}
      </div>

      <div className="flex flex-col">
        {items.length === 0 ? (
          <p className="text-zinc-400 py-6">Bu kategoride henüz yazı bulunmuyor.</p>
        ) : (
          items.map((p) => (
            // @ts-ignore
            <PostPreview key={p.id} post={p} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}
