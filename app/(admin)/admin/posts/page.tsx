import { prisma } from "../../../../lib/prisma";
import PostsTable from "../../../../components/admin/PostsTable";
import PostFilters from "../../../../components/admin/PostFilters";
import Link from "next/link";

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ status?: string; categoryId?: string; q?: string }> }) {
  const params = await searchParams;
  const where: any = {};
  if (params?.status) where.status = params.status;
  if (params?.categoryId) where.categoryId = params.categoryId;
  if (params?.q) where.title = { contains: params.q, mode: "insensitive" };

  const posts = await prisma.post.findMany({
    where,
    include: { category: true, tags: true, _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const categories = await prisma.category.findMany();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Yazılar</h1>
        <Link href="/admin/posts/new" className="px-3 py-2 bg-blue-600 rounded">
          + Yeni Yazı
        </Link>
      </div>

      <PostFilters categories={categories} />

      {/* @ts-ignore */}
      <PostsTable posts={posts} />
    </div>
  );
}
