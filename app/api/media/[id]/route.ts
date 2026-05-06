import { unlink } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const media = await prisma.media.findUnique({ where: { id: params.id } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relativePath = media.url.startsWith("/") ? media.url.slice(1) : media.url;
  const filePath = path.join(process.cwd(), "public", relativePath);

  try {
    await unlink(filePath);
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      // ignore: best-effort filesystem cleanup; DB is the source of truth
    }
  }

  await prisma.media.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
