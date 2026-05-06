import { prisma } from "../../../../lib/prisma";
import PostContent from "../../../../components/public/PostContent";

type Props = { params: { slug: string } };

export default async function PostPage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug },
    include: { author: { select: { id: true, name: true } }, category: true, tags: { include: { tag: true } } },
  });

  if (!post || post.status !== "published") {
    return new Response("Not found", { status: 404 });
  }

  // @ts-ignore
  return (
    <div className="py-8">
      {/* @ts-ignore */}
      <PostContent post={post} />
    </div>
  );
}
