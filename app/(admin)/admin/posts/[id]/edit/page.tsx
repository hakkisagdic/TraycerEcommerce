import PostForm from "../../../../../components/admin/PostForm";
import { prisma } from "../../../../../lib/prisma";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({ where: { id: params.id }, include: { category: true, tags: true } });
  const categories = await prisma.category.findMany();
  const tags = await prisma.tag.findMany();

  if (!post) return <div>Yazı bulunamadı</div>;

  // @ts-ignore
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Yazıyı Düzenle</h1>
      {/* @ts-ignore */}
      <PostForm initial={post} categories={categories} tags={tags} />
    </div>
  );
}
