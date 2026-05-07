import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { prisma } from "../../../../lib/prisma";
import PostContent from "../../../../components/public/PostContent";
import CommentSection from "../../../../components/public/CommentSection";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const post = await prisma.post.findUnique({
    where: { slug: p.slug },
    select: {
      title: true,
      excerpt: true,
      contentText: true,
      seoTitle: true,
      seoDescription: true,
      featuredImage: true,
      status: true,
    },
  });

  if (!post || post.status !== "published") {
    return { title: "Yazı bulunamadı" };
  }

  const description =
    post.seoDescription ?? post.excerpt ?? (post.contentText ?? "").slice(0, 160);

  return {
    title: post.seoTitle ?? post.title,
    description: description || undefined,
    openGraph: post.featuredImage
      ? {
          title: post.seoTitle ?? post.title,
          description: description || undefined,
          images: [{ url: post.featuredImage }],
        }
      : undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const p = await params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { slug: p.slug },
    include: {
      author: { select: { id: true, name: true } },
      category: true,
      tags: { include: { tag: true } },
      comments: {
        where: { status: "approved" },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post || post.status !== "published") {
    notFound();
  }

  return (
    <div className="py-8">
      {/* @ts-ignore */}
      <PostContent post={post} />
      <CommentSection
        postId={post.id}
        // @ts-ignore
        initialComments={post.comments}
        isLoggedIn={Boolean(session?.user)}
      />
    </div>
  );
}
