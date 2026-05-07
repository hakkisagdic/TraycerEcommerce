import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected"]);

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const postId = searchParams.get("postId");

  const where: Prisma.CommentWhereInput = {};
  if (status) {
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    where.status = status;
  }
  if (postId) {
    where.postId = postId;
  }

  const comments = await prisma.comment.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, email: true } },
      post: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: comments });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "admin" && role !== "reader") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.postId !== "string" ||
    typeof body.content !== "string" ||
    body.content.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "postId and content are required" },
      { status: 400 },
    );
  }

  const post = await prisma.post.findUnique({ where: { id: body.postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (role === "reader" && post.status !== "published") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const created = await prisma.comment.create({
    data: {
      content: body.content.trim(),
      status: "pending",
      postId: body.postId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
