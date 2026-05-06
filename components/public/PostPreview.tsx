import Link from "next/link";
import React from "react";

export default function PostPreview({ post }: { post: any }) {
  return (
    <article className="border-b border-zinc-800 py-6">
      <h2 className="text-xl font-semibold">
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      <div className="text-sm text-zinc-400 mt-1">
        {post.author?.name} • {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
      </div>
      {post.excerpt ? <p className="mt-2 text-zinc-200">{post.excerpt}</p> : <p className="mt-2 text-zinc-200">{(post.contentText || "").slice(0, 200)}...</p>}
      <div className="mt-3">
        <Link href={`/posts/${post.slug}`} className="text-blue-400">Devamını oku →</Link>
      </div>
    </article>
  );
}
