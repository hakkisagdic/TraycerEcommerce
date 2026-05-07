import { prisma } from "../../../../lib/prisma";
import CommentsTable from "../../../../components/admin/CommentsTable";

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const where: any = {};
  if (params?.status) where.status = params.status;

  const comments = await prisma.comment.findMany({ where, include: { author: true, post: true }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Yorumlar</h1>
      </div>

      {/* @ts-ignore */}
      <CommentsTable comments={comments} />
    </div>
  );
}
