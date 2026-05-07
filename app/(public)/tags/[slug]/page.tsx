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
  const tag = await prisma.tag.findUnique({ where: { slug: p.slug } });
  if (!tag) {
    return {
      title: "Etiket bulunamadı",
      description: "Aradığınız etiket bulunamadı.",
    };
  }

  const postCount = await prisma.post.count({
    where: {
      status: "published",
      tags: { some: { tagId: tag.id } },
    },
  });

  const description =
    postCount > 0
      ? `#${tag.name} etiketiyle yayımlanmış ${postCount} yazıyı keşfedin.`
      : `#${tag.name} etiketine ait yayımlanmış yazılar.`;

  return {
    title: `#${tag.name}`,
    description,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const p = await params;
  const sp = await searchParams;
  const tag = await prisma.tag.findUnique({ where: { slug: p.slug } });
  if (!tag) {
    notFound();
  }

  const page = Math.max(1, Number(sp?.page ?? 1));
  const limit = Math.min(20, Math.max(1, Number(sp?.limit ?? 10)));

  const where = {
    status: "published",
    tags: { some: { tag: { slug: p.slug } } },
  };

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
        <div className="text-sm text-zinc-400">Etiket</div>
        <h1 className="text-3xl font-bold">#{tag.name}</h1>
      </div>

      <div className="flex flex-col">
        {items.length === 0 ? (
          <p className="text-zinc-400 py-6">Bu etikete sahip yazı bulunmuyor.</p>
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
