import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type FtsRow = { rowid: bigint | number };

function escapeFtsQuery(input: string): string {
  // Quote each whitespace-separated token to safely pass user text into FTS5.
  // Tokens with special characters are still quoted; double-quotes are doubled
  // per FTS5 quoting rules.
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(" ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: "q parameter is required" },
      { status: 400 },
    );
  }

  const ftsQuery = escapeFtsQuery(q);
  if (ftsQuery.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const matches = await prisma.$queryRawUnsafe<FtsRow[]>(
    `SELECT rowid FROM post_fts WHERE post_fts MATCH ? ORDER BY rank LIMIT 20`,
    ftsQuery,
  );

  if (matches.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const rowids = matches.map((row) => Number(row.rowid));

  const rawPosts = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM Post WHERE rowid IN (${rowids.map(() => "?").join(",")})`,
    ...rowids,
  );

  const ids = rawPosts.map((row) => row.id);
  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const posts = await prisma.post.findMany({
    where: { id: { in: ids }, status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { id: true, name: true } },
    },
  });

  const order = new Map(rowids.map((rid, i) => [rawPosts[i]?.id, i] as const));
  const ordered = posts.slice().sort((a, b) => {
    const ai = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });

  return NextResponse.json({ items: ordered });
}
