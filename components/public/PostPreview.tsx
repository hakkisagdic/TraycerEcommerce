import Link from "next/link";
import React from "react";

export default function PostPreview({ post }: { post: any }) {
  const publishedAt = new Date(post.publishedAt || post.createdAt).toLocaleDateString(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <article className="group rounded-3xl border border-zinc-200 bg-white/85 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)]">
      <div className="mb-4 flex items-center gap-3 text-xs text-zinc-500">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700">
          {post.author?.name ?? "Anonim"}
        </span>
        <span>{publishedAt}</span>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 transition-colors group-hover:text-zinc-700">
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      {post.excerpt ? (
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">{post.excerpt}</p>
      ) : (
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">{(post.contentText || "").slice(0, 220)}...</p>
      )}
      <div className="mt-5">
        <Link
          href={`/posts/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-950 transition-colors hover:text-zinc-600"
        >
          Devamını oku
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
