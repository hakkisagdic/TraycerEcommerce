import { NextResponse } from "next/server";

import { searchPosts } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: "q parameter is required" },
      { status: 400 },
    );
  }

  const results = await searchPosts(q);
  const items = results.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
  }));
  return NextResponse.json({ items });
}
