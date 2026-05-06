import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = new Set(["draft", "published"]);

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const authorSelect = isAdmin
    ? { id: true, name: true, email: true }
    : { id: true, name: true };

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: authorSelect },
      comments: {
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.status !== "published" && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (typeof body.slug === "string" && body.slug.trim() !== existing.slug) {
    const conflict = await prisma.post.findUnique({
      where: { slug: body.slug.trim() },
    });
    if (conflict && conflict.id !== existing.id) {
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 409 },
      );
    }
  }

  const status =
    typeof body.status === "string" && ALLOWED_STATUSES.has(body.status)
      ? body.status
      : existing.status;

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.slug === "string") data.slug = body.slug.trim();
  if (typeof body.contentJson === "string") data.contentJson = body.contentJson;
  if (typeof body.contentText === "string") data.contentText = body.contentText;
  if ("excerpt" in body) data.excerpt = body.excerpt ?? null;
  if (status !== existing.status) {
    data.status = status;
    if (status === "published" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }
  if ("featuredImage" in body) data.featuredImage = body.featuredImage ?? null;
  if ("seoTitle" in body) data.seoTitle = body.seoTitle ?? null;
  if ("seoDescription" in body) data.seoDescription = body.seoDescription ?? null;
  if ("publishedAt" in body) {
    data.publishedAt = body.publishedAt ? new Date(String(body.publishedAt)) : null;
  }
  if ("categoryId" in body) {
    data.categoryId =
      typeof body.categoryId === "string" && body.categoryId.length > 0
        ? body.categoryId
        : null;
  }

  const tagIds = Array.isArray(body.tagIds)
    ? (body.tagIds.filter((id) => typeof id === "string") as string[])
    : null;

  const updated = await prisma.$transaction(async (tx) => {
    const post = await tx.post.update({
      where: { id: params.id },
      data,
    });

    if (tagIds !== null) {
      await tx.postTag.deleteMany({ where: { postId: post.id } });
      if (tagIds.length > 0) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId) => ({ postId: post.id, tagId })),
        });
      }
    }

    return tx.post.findUnique({
      where: { id: post.id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
