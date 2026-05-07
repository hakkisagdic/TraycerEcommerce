import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected"]);

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const p = await params;
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: p.id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      post: { select: { id: true, title: true, slug: true } },
    },
  });

  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(comment);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const p = await params;
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

  if (typeof body.status !== "string" || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json(
      { error: "status must be one of pending, approved, rejected" },
      { status: 400 },
    );
  }

  const existing = await prisma.comment.findUnique({
    where: { id: p.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.comment.update({
    where: { id: p.id },
    data: { status: body.status },
    include: {
      author: { select: { id: true, name: true, email: true } },
      post: { select: { id: true, title: true, slug: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const p = await params;
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.comment.findUnique({
    where: { id: p.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.comment.delete({ where: { id: p.id } });
  return NextResponse.json({ success: true });
}
