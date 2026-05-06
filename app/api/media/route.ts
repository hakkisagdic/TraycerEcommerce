import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};
const SUPPORTED_MIME_TYPES = Object.keys(ALLOWED_EXTENSIONS);

export async function GET() {
  const items = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "file field is required" },
      { status: 400 },
    );
  }

  if (!Object.prototype.hasOwnProperty.call(ALLOWED_EXTENSIONS, file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported MIME type. Supported types: ${SUPPORTED_MIME_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_SIZE_BYTES} byte limit` },
      { status: 400 },
    );
  }

  const ext = ALLOWED_EXTENSIONS[file.type];
  const filename = `${randomUUID()}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadsDir, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  const url = `/uploads/${filename}`;
  const media = await prisma.media.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
