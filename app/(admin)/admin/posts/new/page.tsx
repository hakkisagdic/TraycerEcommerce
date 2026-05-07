import PostForm from "../../../../../components/admin/PostForm";
import { prisma } from "../../../../../lib/prisma";

export default async function NewPostPage() {
  const categories = await prisma.category.findMany();
  const tags = await prisma.tag.findMany();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Yeni Yazı</h1>
      {/* @ts-ignore */}
      <PostForm categories={categories} tags={tags} />
    </div>
  );
}
