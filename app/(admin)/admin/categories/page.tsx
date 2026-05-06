import { prisma } from "../../../../lib/prisma";
import CategoriesManager from "../../../../components/admin/CategoriesManager";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ include: { _count: { select: { posts: true } } } });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Kategoriler</h1>
      </div>

      {/* @ts-ignore */}
      <CategoriesManager categories={categories} />
    </div>
  );
}
