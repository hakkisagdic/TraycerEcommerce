import { prisma } from "../../lib/prisma";
import PostPreview from "../../components/public/PostPreview";
import Pagination from "../../components/public/Pagination";

export default async function HomePage({ searchParams }: { searchParams?: any }) {
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const limit = Math.min(20, Math.max(1, Number(searchParams?.limit ?? 10)));

  const where: any = { status: "published" };

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
      <h1 className="text-3xl font-bold mb-6">Blog</h1>

      <form action="/search" method="get" className="mb-4">
        <input name="q" placeholder="Ara..." className="px-3 py-2 bg-white/5 rounded w-full max-w-md" />
      </form>

      <div className="flex flex-col">
        {items.map((p) => (
          // @ts-ignore
          <PostPreview key={p.id} post={p} />
        ))}
      </div>

      {/* @ts-ignore */}
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
