import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = new Set(["draft", "published"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const statusParam = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const tagSlug = searchParams.get("tag");
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10),
  );

  const where: Prisma.PostWhereInput = {};

  if (statusParam) {
    if (!ALLOWED_STATUSES.has(statusParam)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (!isAdmin && statusParam !== "published") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    where.status = statusParam;
  } else if (!isAdmin) {
    where.status = "published";
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (tagSlug) {
    where.tags = { some: { tag: { slug: tagSlug } } };
  }

  const authorSelect = isAdmin
    ? { id: true, name: true, email: true }
    : { id: true, name: true };

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true } },
        author: { select: authorSelect },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: Request) {
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

  if (!isNonEmptyString(body.title) || !isNonEmptyString(body.slug)) {
    return NextResponse.json(
      { error: "title and slug are required" },
      { status: 400 },
    );
  }
  if (!isNonEmptyString(body.contentJson) || !isNonEmptyString(body.contentText)) {
    return NextResponse.json(
      { error: "contentJson and contentText are required" },
      { status: 400 },
    );
  }

  const status =
    typeof body.status === "string" && ALLOWED_STATUSES.has(body.status)
      ? body.status
      : "draft";

  const tagIds = Array.isArray(body.tagIds)
    ? (body.tagIds.filter((id) => typeof id === "string") as string[])
    : [];

  const existing = await prisma.post.findUnique({
    where: { slug: body.slug.trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const publishedAt =
    status === "published"
      ? body.publishedAt
        ? new Date(String(body.publishedAt))
        : new Date()
      : body.publishedAt
        ? new Date(String(body.publishedAt))
        : null;

  const created = await prisma.post.create({
    data: {
      title: body.title.trim(),
      slug: body.slug.trim(),
      contentJson: body.contentJson,
      contentText: body.contentText,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
      status,
      featuredImage:
        typeof body.featuredImage === "string" ? body.featuredImage : null,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : null,
      seoDescription:
        typeof body.seoDescription === "string" ? body.seoDescription : null,
      publishedAt,
      authorId: session.user.id,
      categoryId:
        typeof body.categoryId === "string" && body.categoryId.length > 0
          ? body.categoryId
          : null,
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
