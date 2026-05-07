import { unlink } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const p = await params;
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const media = await prisma.media.findUnique({ where: { id: p.id } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (media.filename) {
    const mediaPath = path.join(process.cwd(), "public", "uploads", media.filename);
    try {
      await unlink(mediaPath);
    } catch {
      // File might not exist, ignore error
    }
  }

  await prisma.media.delete({ where: { id: p.id } });
  return NextResponse.json({ success: true });
}
