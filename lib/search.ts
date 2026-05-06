import { prisma } from "@/lib/prisma";

type FtsRow = { rowid: bigint | number };

export type PostSearchSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
};

export function escapeFtsQuery(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(" ");
}

async function searchPostIds(q: string): Promise<string[]> {
  if (!q || q.trim().length === 0) {
    return [];
  }

  const ftsQuery = escapeFtsQuery(q);
  if (ftsQuery.length === 0) {
    return [];
  }

  const matches = await prisma.$queryRawUnsafe<FtsRow[]>(
    `SELECT rowid FROM post_fts WHERE post_fts MATCH ? ORDER BY rank LIMIT 20`,
    ftsQuery,
  );

  if (matches.length === 0) {
    return [];
  }

  const rowids = matches.map((row) => Number(row.rowid));

  const rawPosts = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM Post WHERE rowid IN (${rowids.map(() => "?").join(",")})`,
    ...rowids,
  );

  return rawPosts.map((row) => row.id);
}

function orderById<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const order = new Map(ids.map((id, i) => [id, i] as const));
  return items.slice().sort((a, b) => {
    const ai = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

export async function searchPosts(q: string): Promise<PostSearchSummary[]> {
  const ids = await searchPostIds(q);
  if (ids.length === 0) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: { id: { in: ids }, status: "published" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
    },
  });

  return orderById(posts, ids);
}

export async function searchPostsForListing(q: string) {
  const ids = await searchPostIds(q);
  if (ids.length === 0) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: { id: { in: ids }, status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { id: true, name: true } },
    },
  });

  return orderById(posts, ids);
}
