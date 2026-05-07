import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const p = await params;
  const category = await prisma.category.findUnique({
    where: { id: p.id },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(category);
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

  const existing = await prisma.category.findUnique({
    where: { id: p.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (typeof body.slug === "string" && body.slug.trim() !== existing.slug) {
    const conflict = await prisma.category.findUnique({
      where: { slug: body.slug.trim() },
    });
    if (conflict && conflict.id !== existing.id) {
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 409 },
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.slug === "string") data.slug = body.slug.trim();
  if ("description" in body) data.description = body.description ?? null;

  const updated = await prisma.category.update({
    where: { id: p.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const p = await params;
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.category.findUnique({
    where: { id: p.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id: p.id } });
  return NextResponse.json({ success: true });
}
