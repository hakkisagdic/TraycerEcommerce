import { prisma } from "../../../../lib/prisma";
import TagsManager from "../../../../components/admin/TagsManager";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({ include: { _count: { select: { posts: true } } } });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Etiketler</h1>
      </div>

      {/* @ts-ignore */}
      <TagsManager tags={tags} />
    </div>
  );
}
